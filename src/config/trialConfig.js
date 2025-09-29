/**
 * Trial Configuration
 * 
 * This file contains configuration for the free trial functionality.
 * You can easily modify these values without changing the main code.
 */

module.exports = {
    // Trial period in days (default: 14 days)
    TRIAL_PERIOD_DAYS: process.env.STRIPE_TRIAL_PERIOD_DAYS || 14,

    // Whether to require card details upfront (recommended: true)
    REQUIRE_CARD_UPFRONT: process.env.REQUIRE_CARD_UPFRONT !== 'false',

    // Trial warning notification (days before trial ends)
    TRIAL_WARNING_DAYS: parseInt(process.env.TRIAL_WARNING_DAYS) || 3,

    // Whether to send email notifications (requires email service setup)
    SEND_TRIAL_NOTIFICATIONS: process.env.SEND_TRIAL_NOTIFICATIONS === 'true',

    // Trial statuses
    TRIAL_STATUSES: {
        NONE: 'none',
        ACTIVE: 'active',
        ENDING_SOON: 'ending_soon',
        COMPLETED: 'completed',
        PAYMENT_FAILED: 'payment_failed',
        PAST_DUE: 'past_due'
    }
};
