const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const subscriptionSchema = new Schema(
    {
        hrAdmin: { type: Schema.Types.ObjectId, ref: "HR-Admin", required: true, index: true, unique: true },
        status: { type: String, enum: ["incomplete", "trialing", "active", "past_due", "canceled", "unpaid", "incomplete_expired"], default: "incomplete" },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        stripeSubscriptionItemId: { type: String }, // For metered billing usage reporting
        currentPeriodEnd: { type: Date },
        pricePerSeatCents: { type: Number, default: 0 },
        seatCount: { type: Number, default: 0 },
        lastSyncedAt: { type: Date },
        lastUsageReported: { type: Date },
        // If super admin grants access regardless of billing
        accessGrantedBySuperAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const SubscriptionModel = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
module.exports = SubscriptionModel;


