const asyncHandler = require("../utils/asyncHandler");
const SubscriptionModel = require("../models/subscription");
const HRAdminModel = require("../models/hr-admin");
const AuthModel = require("../models/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { reportSeatUsage, reportUsageIfChanged } = require("../utils/stripeUsageReporting");

// Helper function to sync subscription data from Stripe
async function syncSubscriptionFromStripe(stripeCustomerId) {
    try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
            limit: 1
        });

        if (subscriptions.data.length > 0) {
            const stripeSub = subscriptions.data[0];

            // Get subscription item ID for metered billing
            let stripeSubscriptionItemId = null;
            if (stripeSub.items && stripeSub.items.data && stripeSub.items.data.length > 0) {
                stripeSubscriptionItemId = stripeSub.items.data[0].id;
            }

            // Safely handle current_period_end
            let currentPeriodEnd = null;
            if (stripeSub.current_period_end) {
                const date = new Date(stripeSub.current_period_end * 1000);
                if (!isNaN(date.getTime())) {
                    currentPeriodEnd = date;
                }
            }

            const updateData = {
                status: stripeSub.status,
                stripeSubscriptionId: stripeSub.id,
                lastSyncedAt: new Date()
            };

            if (currentPeriodEnd) {
                updateData.currentPeriodEnd = currentPeriodEnd;
            }

            if (stripeSubscriptionItemId) {
                updateData.stripeSubscriptionItemId = stripeSubscriptionItemId;
            }

            await SubscriptionModel.findOneAndUpdate(
                { stripeCustomerId: stripeCustomerId },
                updateData,
                { upsert: true }
            );

            return updateData;
        }
    } catch (error) {
        console.error('Error syncing subscription from Stripe:', error.message);
    }
    return null;
}

exports.getMySubscription = asyncHandler(async (req, res) => {
    const hrAdminAuthId = req.user._id;
    const hrAdmin = await HRAdminModel.findOne({ auth: hrAdminAuthId }).populate('employees');
    if (!hrAdmin) return res.status(404).json({ success: false, message: 'HR-Admin profile not found' });

    let sub = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });
    const seatCount = hrAdmin.employees?.length || 0;

    const response = {
        subscription: sub,
        seatCount,
    };
    return res.status(200).json({ success: true, data: response });
});

exports.createCheckoutSession = asyncHandler(async (req, res) => {
    const hrAdminAuthId = req.user._id;
    const hrAdmin = await HRAdminModel.findOne({ auth: hrAdminAuthId }).populate('employees');
    if (!hrAdmin) return res.status(404).json({ success: false, message: 'HR-Admin profile not found' });

    const seatCount = hrAdmin.employees?.length || 0;
    let { priceId } = req.body; // Stripe price id with metered/seat pricing configured
    if (!priceId) {
        priceId = process.env.STRIPE_PRICE_ID; // fallback to server env
    }
    if (!priceId) {
        return res.status(400).json({ success: false, message: 'Missing Stripe priceId. Configure STRIPE_PRICE_ID on server or pass priceId in body.' });
    }

    // Fetch auth user to prefill email/name in Stripe Checkout
    const authUser = await AuthModel.findById(hrAdminAuthId).lean();

    // Check if customer already exists to avoid duplicates
    let customer;
    const existingCustomers = await stripe.customers.list({
        email: authUser?.email,
        limit: 1
    });

    if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
    } else {
        customer = await stripe.customers.create({
            email: authUser?.email,
            name: authUser?.fullName,
            metadata: { hrAdminId: String(hrAdmin._id), authId: String(hrAdminAuthId) },
        });
    }

    // Ensure we have a proper frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!frontendUrl.startsWith('http')) {
        throw new Error('FRONTEND_BASE_URL or CLIENT_URL must include http:// or https://');
    }

    // Determine if the price is metered to avoid sending quantity
    const priceObj = await stripe.prices.retrieve(priceId);
    const isMetered = priceObj?.recurring?.usage_type === 'metered';

    const lineItem = isMetered
        ? { price: priceId }
        : { price: priceId, quantity: seatCount || 1 };

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customer.id,
        line_items: [lineItem],
        success_url: `${frontendUrl}/Subscription?success=1`,
        cancel_url: `${frontendUrl}/Subscription?canceled=1`,
        payment_method_types: ['card'],
        payment_method_collection: 'always'
        // We set the customer's default PM in the webhook `checkout.session.completed`
    });

    await SubscriptionModel.findOneAndUpdate(
        { hrAdmin: hrAdmin._id },
        { stripeCustomerId: customer.id, seatCount },
        { upsert: true }
    );

    return res.status(200).json({ success: true, url: session.url });
});

// Report usage to Stripe for metered billing
exports.reportUsage = asyncHandler(async (req, res) => {
    const hrAdminAuthId = req.user._id;
    const hrAdmin = await HRAdminModel.findOne({ auth: hrAdminAuthId }).populate('employees');
    if (!hrAdmin) return res.status(404).json({ success: false, message: 'HR-Admin profile not found' });

    const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });
    if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    const seatCount = hrAdmin.employees?.length || 0;

    try {
        // Report usage to Stripe using new Billing Meter Events API (with deduplication)
        await reportUsageIfChanged(subscription.stripeCustomerId, seatCount);

        res.status(200).json({
            success: true,
            message: `Usage reported: ${seatCount} employees`,
            seatCount
        });
    } catch (error) {
        console.error('Error reporting usage:', error.message);
        res.status(500).json({ success: false, message: 'Failed to report usage to Stripe' });
    }
});

exports.stripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];


    let event;
    try {
        // For raw body parser, req.body should be a Buffer
        const body = req.body;

        // If body is not a Buffer, try to convert it
        let rawBody = body;
        if (!Buffer.isBuffer(body)) {
            if (typeof body === 'string') {
                rawBody = Buffer.from(body, 'utf8');
            } else if (typeof body === 'object') {
                rawBody = Buffer.from(JSON.stringify(body), 'utf8');
            }
        }

        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const s = event.data.object;
            try {
                if (s.mode === 'subscription' && s.customer) {
                    let pmId = null;
                    if (s.setup_intent) {
                        const si = await stripe.setupIntents.retrieve(s.setup_intent);
                        pmId = si?.payment_method || null;
                    }
                    // Fallback if no setup_intent
                    if (!pmId && s.payment_method) {
                        pmId = s.payment_method;
                    }

                    if (pmId) {
                        await stripe.customers.update(s.customer, {
                            invoice_settings: { default_payment_method: pmId }
                        });
                    }
                }
            } catch (e) {
                console.error('Error setting default payment method on checkout completion:', e.message);
            }
            break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const sub = event.data.object;
            const customerId = sub.customer;
            const stripeSubscriptionId = sub.id;

            // Get subscription item ID for metered billing
            let stripeSubscriptionItemId = null;
            if (sub.items && sub.items.data && sub.items.data.length > 0) {
                stripeSubscriptionItemId = sub.items.data[0].id;
            }

            // Safely handle current_period_end
            let currentPeriodEnd = null;
            if (sub.current_period_end) {
                const date = new Date(sub.current_period_end * 1000);
                if (!isNaN(date.getTime())) {
                    currentPeriodEnd = date;
                }
            }

            const updateData = {
                status: sub.status,
                stripeSubscriptionId,
                lastSyncedAt: new Date()
            };

            if (currentPeriodEnd) {
                updateData.currentPeriodEnd = currentPeriodEnd;
            }

            if (stripeSubscriptionItemId) {
                updateData.stripeSubscriptionItemId = stripeSubscriptionItemId;
            }

            const updatedSubscription = await SubscriptionModel.findOneAndUpdate(
                { stripeCustomerId: customerId },
                updateData,
                { upsert: true, new: true }
            );


            // Special handling for cancellation status changes
            if (sub.status === 'canceled' && event.type === 'customer.subscription.updated') {
                // Clear subscription-specific fields for canceled subscriptions
                await SubscriptionModel.findOneAndUpdate(
                    { stripeCustomerId: customerId },
                    {
                        stripeSubscriptionId: null,
                        currentPeriodEnd: null,
                        lastSyncedAt: new Date()
                    }
                );
            }

            // If this is a new subscription creation, report initial usage
            if (event.type === 'customer.subscription.created' && stripeSubscriptionItemId) {
                try {
                    // Get the HR-Admin to report current employee count
                    const subscription = await SubscriptionModel.findOne({ stripeCustomerId: customerId });
                    if (subscription) {
                        const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin).populate('employees');
                        if (hrAdmin) {
                            const seatCount = hrAdmin.employees?.length || 0;

                            // Report initial usage to Stripe using new Billing Meter Events API
                            await reportUsageIfChanged(customerId, seatCount);

                        } else {
                            // HR-Admin not found, report 0 seats
                            await reportUsageIfChanged(customerId, 0);
                        }
                    }
                } catch (error) {
                    console.error('Error reporting initial usage:', error.message);
                }
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const sub = event.data.object;
            const customerId = sub.customer;
            const subscriptionId = sub.id;

            try {
                await SubscriptionModel.findOneAndUpdate(
                    { stripeCustomerId: customerId },
                    {
                        status: 'canceled',
                        stripeSubscriptionId: null, // Clear subscription ID since it's deleted
                        currentPeriodEnd: null, // Clear period end
                        lastSyncedAt: new Date()
                    },
                    { new: true }
                );
            } catch (error) {
                console.error('Error handling subscription deletion:', error.message);
            }
            break;
        }
        case 'invoice.created': {
            // Invoice has been created - usage should already be reported via invoice.upcoming
            break;
        }
        case 'invoice.payment_succeeded': {
            // Log successful payment and report current usage for next billing cycle
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const billingPeriodStart = new Date(invoice.period_start * 1000);

            // Report current employee count immediately after payment for next billing cycle
            try {
                const subscription = await SubscriptionModel.findOne({ stripeCustomerId: customerId });
                if (subscription) {
                    const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin).populate('employees');
                    if (hrAdmin) {
                        const seatCount = hrAdmin.employees?.length || 0;

                        // Force report current usage for the next billing cycle (bypass deduplication)
                        // This ensures Stripe always has the correct seat count after payment
                        const { reportSeatUsage } = require('../utils/stripeUsageReporting');

                        // For last aggregation, report the total seat count for the new billing period
                        // Use the billing period start as timestamp to ensure it's always current
                        const billingPeriodTimestamp = Math.floor(billingPeriodStart.getTime() / 1000);
                        await reportSeatUsage(customerId, seatCount, 'employee_seats_last', billingPeriodTimestamp);

                        // Update local subscription record with current billing period info
                        await SubscriptionModel.findOneAndUpdate(
                            { stripeCustomerId: customerId },
                            {
                                seatCount,
                                lastUsageReported: billingPeriodStart,
                                currentPeriodEnd: new Date(invoice.period_end * 1000)
                            }
                        );

                    } else {
                        // HR-Admin not found, report 0 seats
                        const { reportSeatUsage } = require('../utils/stripeUsageReporting');
                        const billingPeriodTimestamp = Math.floor(billingPeriodStart.getTime() / 1000);
                        await reportSeatUsage(customerId, 0, 'employee_seats_last', billingPeriodTimestamp);

                        await SubscriptionModel.findOneAndUpdate(
                            { stripeCustomerId: customerId },
                            {
                                seatCount: 0,
                                lastUsageReported: billingPeriodStart,
                                currentPeriodEnd: new Date(invoice.period_end * 1000)
                            }
                        );

                    }
                }
            } catch (error) {
                console.error('Error reporting post-payment usage:', error.message);
            }

            // You can add revenue tracking logic here if needed
            break;
        }
        case 'invoice.upcoming': {
            // Report usage BEFORE invoice is created to ensure metered billing works correctly
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const billingPeriodStart = new Date(invoice.period_start * 1000);

            try {
                const subscription = await SubscriptionModel.findOne({ stripeCustomerId: customerId });
                if (subscription) {
                    const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin).populate('employees');
                    if (hrAdmin) {
                        const seatCount = hrAdmin.employees?.length || 0;

                        // Update subscription with upcoming billing period date
                        await SubscriptionModel.findOneAndUpdate(
                            { stripeCustomerId: customerId },
                            {
                                lastUsageReported: billingPeriodStart,
                                currentPeriodEnd: new Date(invoice.period_end * 1000)
                            }
                        );

                        // Report usage for the upcoming billing period using billing period timestamp
                        const billingPeriodTimestamp = Math.floor(billingPeriodStart.getTime() / 1000);
                        const { reportSeatUsage } = require('../utils/stripeUsageReporting');
                        await reportSeatUsage(customerId, seatCount, 'employee_seats_last', billingPeriodTimestamp);

                    } else {
                        // HR-Admin not found, report 0 seats
                        await SubscriptionModel.findOneAndUpdate(
                            { stripeCustomerId: customerId },
                            {
                                lastUsageReported: billingPeriodStart,
                                currentPeriodEnd: new Date(invoice.period_end * 1000)
                            }
                        );

                        const billingPeriodTimestamp = Math.floor(billingPeriodStart.getTime() / 1000);
                        const { reportSeatUsage } = require('../utils/stripeUsageReporting');
                        await reportSeatUsage(customerId, 0, 'employee_seats_last', billingPeriodTimestamp);

                    }
                }
            } catch (error) {
                console.error('Error reporting upcoming billing usage:', error.message);
            }
            break;
        }
        default:
            break;
    }

    res.json({ received: true });
});

// Manual sync subscription data from Stripe
exports.syncSubscription = asyncHandler(async (req, res) => {
    const hrAdminAuthId = req.user._id;
    const hrAdmin = await HRAdminModel.findOne({ auth: hrAdminAuthId });
    if (!hrAdmin) return res.status(404).json({ success: false, message: 'HR-Admin profile not found' });

    const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });
    if (!subscription || !subscription.stripeCustomerId) {
        return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    try {
        const syncedData = await syncSubscriptionFromStripe(subscription.stripeCustomerId);

        if (syncedData) {
            res.status(200).json({
                success: true,
                message: 'Subscription synced successfully',
                data: syncedData
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No subscription found in Stripe'
            });
        }
    } catch (error) {
        console.error('Error syncing subscription:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to sync subscription'
        });
    }
});

// Report usage for all active subscriptions (useful for testing and maintenance)
exports.reportAllUsage = asyncHandler(async (req, res) => {
    try {
        const activeSubscriptions = await SubscriptionModel.find({
            status: { $in: ['active', 'trialing'] },
            stripeCustomerId: { $exists: true }
        }).populate('hrAdmin');

        const results = [];

        for (const subscription of activeSubscriptions) {
            try {
                const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin._id).populate('employees');
                if (hrAdmin) {
                    const seatCount = hrAdmin.employees?.length || 0;

                    // Report usage to Stripe (with deduplication)
                    await reportUsageIfChanged(subscription.stripeCustomerId, seatCount);

                    results.push({
                        customerId: subscription.stripeCustomerId,
                        hrAdminEmail: hrAdmin.email,
                        seatCount,
                        status: 'success'
                    });

                } else {
                    // HR-Admin not found, report 0 seats
                    await reportUsageIfChanged(subscription.stripeCustomerId, 0);

                    results.push({
                        customerId: subscription.stripeCustomerId,
                        hrAdminEmail: 'HR-Admin not found',
                        seatCount: 0,
                        status: 'success'
                    });

                }
            } catch (error) {
                console.error(`❌ Error reporting usage for ${subscription.stripeCustomerId}:`, error.message);
                results.push({
                    customerId: subscription.stripeCustomerId,
                    seatCount: 0,
                    status: 'error',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Usage reported for ${results.length} subscriptions`,
            results
        });
    } catch (error) {
        console.error('Error reporting all usage:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to report usage for all subscriptions'
        });
    }
});


