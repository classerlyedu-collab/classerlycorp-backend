const asyncHandler = require("../utils/asyncHandler");
const SubscriptionModel = require("../models/subscription");
const HRAdminModel = require("../models/hr-admin");
const AuthModel = require("../models/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getMySubscription = asyncHandler(async (req, res) => {
    const hrAdminAuthId = req.user._id;
    const hrAdmin = await HRAdminModel.findOne({ auth: hrAdminAuthId }).populate('employees');
    if (!hrAdmin) return res.status(404).json({ success: false, message: 'HR-Admin profile not found' });

    const sub = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });
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
        // Report usage to Stripe
        await stripe.subscriptionItems.createUsageRecord(
            subscription.stripeSubscriptionItemId, // We need to store this
            {
                quantity: seatCount,
                timestamp: Math.floor(Date.now() / 1000), // Current timestamp
                action: 'set' // Set the quantity to this value
            }
        );

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

    let event;
    try {
        // For raw body parser, req.body should be a Buffer
        const body = req.body;
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
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

                        // Report initial usage to Stripe
                        await stripe.subscriptionItems.createUsageRecord(
                            stripeSubscriptionItemId,
                            {
                                quantity: seatCount,
                                timestamp: Math.floor(Date.now() / 1000),
                                action: 'set'
                            }
                        );

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
        default:
            break;
    }

    res.json({ received: true });
});


