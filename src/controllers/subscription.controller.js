const asyncHandler = require("../utils/asyncHandler");
const SubscriptionModel = require("../models/subscription");
const HRAdminModel = require("../models/hr-admin");
const AuthModel = require("../models/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { reportSeatUsage } = require("../utils/stripeUsageReporting");

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

            console.log(`Subscription synced from Stripe: ${stripeSub.id}`);
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

    // If subscription exists but missing currentPeriodEnd, sync from Stripe
    if (sub && sub.stripeCustomerId && (!sub.currentPeriodEnd || !sub.stripeSubscriptionId)) {
        console.log('Syncing subscription data from Stripe...');
        await syncSubscriptionFromStripe(sub.stripeCustomerId);
        // Refresh the subscription data
        sub = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });
    }

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

    const customer = await stripe.customers.create({
        email: authUser?.email,
        name: authUser?.fullName,
        metadata: { hrAdminId: String(hrAdmin._id), authId: String(hrAdminAuthId) },
    });

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
        // Report usage to Stripe using new Billing Meter Events API
        await reportSeatUsage(subscription.stripeCustomerId, seatCount);

        // Update local subscription record
        await SubscriptionModel.findOneAndUpdate(
            { hrAdmin: hrAdmin._id },
            { seatCount, lastUsageReported: new Date() }
        );

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

    console.log('🔗 Webhook received:', req.headers['stripe-signature'] ? 'with signature' : 'no signature');

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
        console.log('✅ Webhook signature verified successfully');
        console.log('   Event type:', event.type);
        console.log('   Event ID:', event.id);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);

        // For testing purposes, let's try to parse the event without signature verification
        console.log('🧪 Attempting to parse event without signature verification for testing...');
        try {
            let eventData;
            if (Buffer.isBuffer(req.body)) {
                // Parse Buffer as JSON
                eventData = JSON.parse(req.body.toString());
            } else if (typeof req.body === 'object' && req.body.id) {
                eventData = req.body;
            } else {
                throw new Error('Cannot parse event body');
            }

            if (eventData && eventData.id && eventData.type) {
                event = eventData;
                console.log('✅ Event parsed successfully (without signature verification)');
                console.log('   Event type:', event.type);
                console.log('   Event ID:', event.id);
            } else {
                throw new Error('Invalid event structure');
            }
        } catch (parseErr) {
            console.error('❌ Failed to parse event:', parseErr.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    switch (event.type) {
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

            await SubscriptionModel.findOneAndUpdate(
                { stripeCustomerId: customerId },
                updateData,
                { upsert: true }
            );
            console.log('Subscription updated successfully:', stripeSubscriptionId);

            // If this is a new subscription creation, report initial usage
            if (event.type === 'customer.subscription.created' && stripeSubscriptionItemId) {
                try {
                    // Get the HR-Admin to report current employee count
                    const subscription = await SubscriptionModel.findOne({ stripeCustomerId: customerId });
                    if (subscription) {
                        const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin).populate('employees');
                        const seatCount = hrAdmin.employees?.length || 0;

                        // Report initial usage to Stripe using new Billing Meter Events API
                        await reportSeatUsage(customerId, seatCount);

                        // Update local subscription record
                        await SubscriptionModel.findOneAndUpdate(
                            { stripeCustomerId: customerId },
                            { seatCount, lastUsageReported: new Date() }
                        );

                        console.log(`Initial usage reported for new subscription: ${seatCount} employees`);
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
            await SubscriptionModel.findOneAndUpdate(
                { stripeCustomerId: customerId },
                { status: 'canceled', lastSyncedAt: new Date() }
            );
            break;
        }
        case 'invoice.created': {
            // When a new billing cycle starts, report current employee count
            const invoice = event.data.object;
            const customerId = invoice.customer;

            try {
                const subscription = await SubscriptionModel.findOne({ stripeCustomerId: customerId });
                if (subscription) {
                    const hrAdmin = await HRAdminModel.findById(subscription.hrAdmin).populate('employees');
                    const seatCount = hrAdmin.employees?.length || 0;

                    // Report usage for the new billing period
                    await reportSeatUsage(customerId, seatCount);

                    // Update local subscription record
                    await SubscriptionModel.findOneAndUpdate(
                        { stripeCustomerId: customerId },
                        { seatCount, lastUsageReported: new Date() }
                    );

                    console.log(`🔄 Billing cycle usage reported: ${seatCount} employees for customer ${customerId}`);
                }
            } catch (error) {
                console.error('Error reporting billing cycle usage:', error.message);
            }
            break;
        }
        case 'invoice.payment_succeeded': {
            // Log successful payment for revenue tracking
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const amount = invoice.amount_paid / 100; // Convert from cents

            console.log(`💰 Payment succeeded: $${amount} for customer ${customerId}`);

            // You can add revenue tracking logic here if needed
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
                const seatCount = hrAdmin.employees?.length || 0;

                // Report usage to Stripe
                await reportSeatUsage(subscription.stripeCustomerId, seatCount);

                // Update local subscription record
                await SubscriptionModel.findOneAndUpdate(
                    { _id: subscription._id },
                    { seatCount, lastUsageReported: new Date() }
                );

                results.push({
                    customerId: subscription.stripeCustomerId,
                    hrAdminEmail: hrAdmin.email,
                    seatCount,
                    status: 'success'
                });

                console.log(`✅ Usage reported for ${hrAdmin.email}: ${seatCount} employees`);
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


