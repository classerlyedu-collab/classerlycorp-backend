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
 * @param {number} customTimestamp - Optional custom timestamp (defaults to current time)
 * @returns {Promise<Object>} Stripe meter event response
 */
async function reportSeatUsage(stripeCustomerId, seatCount, eventName = 'employee_seats_last', customTimestamp = null) {
    try {
        // Use custom timestamp if provided, otherwise use current time
        const timestamp = customTimestamp || Math.floor(Date.now() / 1000);

        const meterEvent = await stripe.billing.meterEvents.create({
            event_name: eventName,
            timestamp: timestamp,
            payload: {
                stripe_customer_id: stripeCustomerId,
                value: seatCount
            }
        });

        return meterEvent;
    } catch (error) {
        console.error('Error reporting usage to Stripe:', error.message);

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
                console.error('Both new and legacy APIs failed:', legacyError.message);
                throw legacyError;
            }
        }
        throw error;
    }
}

/**
 * Report usage for the current billing period (prevents duplicate reporting)
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {number} seatCount - Number of employee seats
 * @param {string} eventName - Name of the meter event (default: 'per_employee')
 * @returns {Promise<Object>} Stripe meter event response
 */
async function reportBillingPeriodUsage(stripeCustomerId, seatCount, eventName = 'employee_seats_last') {
    try {
        // Use current timestamp - webhook handlers will provide billing period timestamps
        const timestamp = Math.floor(Date.now() / 1000);


        return await reportSeatUsage(stripeCustomerId, seatCount, eventName, timestamp);
    } catch (error) {
        console.error('Error reporting billing period usage:', error.message);
        throw error;
    }
}

/**
 * Report usage with deduplication (only report if count has changed)
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {number} seatCount - Number of employee seats
 * @param {string} eventName - Name of the meter event (default: 'per_employee')
 * @returns {Promise<Object|null>} Stripe meter event response or null if no change
 */
async function reportUsageIfChanged(stripeCustomerId, seatCount, eventName = 'employee_seats_last', customTimestamp = null, force = false) {
    try {
        // Import here to avoid circular dependency
        const SubscriptionModel = require('../models/subscription');

        // Check if the seat count has changed since last report
        const subscription = await SubscriptionModel.findOne({ stripeCustomerId });
        if (!force && subscription && subscription.seatCount === seatCount && !customTimestamp) {
            return null;
        }

        // For 'last' aggregation, report the total current seat count
        // This ensures Stripe knows the exact number of active seats
        const timestampToUse = customTimestamp || undefined;
        const result = await reportSeatUsage(stripeCustomerId, seatCount, eventName, timestampToUse);


        // Update the subscription record
        if (subscription) {
            await SubscriptionModel.findOneAndUpdate(
                { stripeCustomerId },
                { seatCount, lastUsageReported: new Date() }
            );
        }

        return result;
    } catch (error) {
        console.error('Error reporting usage with deduplication:', error.message);
        throw error;
    }
}

module.exports = {
    reportSeatUsage,
    reportUsageWithFallback,
    reportBillingPeriodUsage,
    reportUsageIfChanged
};
