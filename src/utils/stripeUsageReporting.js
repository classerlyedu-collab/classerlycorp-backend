/**
 * Stripe Usage Reporting Utility
 * Handles reporting employee seat usage to Stripe using the new Billing Meter Events API
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Report employee seat usage to Stripe
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {number} seatCount - Number of employee seats
 * @param {string} eventName - Name of the meter event (default: 'per_employee')
 * @returns {Promise<Object>} Stripe meter event response
 */
async function reportSeatUsage(stripeCustomerId, seatCount, eventName = 'per_employee') {
    try {
        const meterEvent = await stripe.billing.meterEvents.create({
            event_name: eventName,
            timestamp: Math.floor(Date.now() / 1000),
            payload: {
                stripe_customer_id: stripeCustomerId,
                value: seatCount
            }
        });

        console.log(`✅ Usage reported to Stripe: ${seatCount} seats for customer ${stripeCustomerId}`);
        console.log(`   Meter Event ID: ${meterEvent.id}`);
        return meterEvent;
    } catch (error) {
        console.error('❌ Error reporting usage to Stripe:', error.message);
        console.error('   Customer ID:', stripeCustomerId);
        console.error('   Seat Count:', seatCount);
        console.error('   Event Name:', eventName);

        // If it's a meter not found error, provide helpful guidance
        if (error.message.includes('meter') || error.message.includes('event_name') || error.message.includes('No active meter')) {
            console.error('💡 Make sure you have created a billing meter named "per_employee" in your Stripe dashboard');
            console.error('   Go to: Stripe Dashboard > Billing > Meters > Create meter');
            console.error('   Event name: per_employee');
            console.error('   Aggregation: sum (or raw)');
            console.error('   Your meter ID: mtr_test_61TM7mt91n1y6k8tM41Q6rYBXLmLuNOC');
        }

        throw error;
    }
}

/**
 * Report usage with fallback to legacy API (for backward compatibility)
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {string} stripeSubscriptionItemId - Stripe subscription item ID (for legacy)
 * @param {number} seatCount - Number of employee seats
 * @returns {Promise<Object>} Stripe response
 */
async function reportUsageWithFallback(stripeCustomerId, stripeSubscriptionItemId, seatCount) {
    try {
        // Try new Billing Meter Events API first
        return await reportSeatUsage(stripeCustomerId, seatCount);
    } catch (error) {
        // If new API fails and we have subscription item ID, try legacy API
        if (stripeSubscriptionItemId && error.message.includes('meter')) {
            console.log('🔄 Falling back to legacy usage record API...');
            try {
                return await stripe.subscriptionItems.createUsageRecord(
                    stripeSubscriptionItemId,
                    {
                        quantity: seatCount,
                        timestamp: Math.floor(Date.now() / 1000),
                        action: 'set'
                    }
                );
            } catch (legacyError) {
                console.error('❌ Both new and legacy APIs failed:', legacyError.message);
                throw legacyError;
            }
        }
        throw error;
    }
}

module.exports = {
    reportSeatUsage,
    reportUsageWithFallback
};
