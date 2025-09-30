const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const HRAdminModel = require("../models/hr-admin");
const SubscriptionModel = require("../models/subscription");

// Grant or revoke subscription access for HR-Admin
exports.toggleSubscriptionAccess = asyncHandler(async (req, res) => {
    try {
        const { hrAdminId } = req.body;

        if (!hrAdminId) {
            return res.status(400).json({
                success: false,
                message: "HR-Admin ID is required"
            });
        }

        // Find the HR-Admin
        const hrAdmin = await HRAdminModel.findById(hrAdminId);
        if (!hrAdmin) {
            return res.status(404).json({
                success: false,
                message: "HR-Admin not found"
            });
        }

        // Find or create subscription record
        let subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdminId });

        if (!subscription) {
            // Create new subscription record with super admin access
            subscription = await SubscriptionModel.create({
                hrAdmin: hrAdminId,
                status: 'active',
                accessGrantedBySuperAdmin: true,
                pricePerSeatCents: 0,
                seatCount: 0
            });

            return res.status(200).json({
                success: true,
                message: "Subscription access granted successfully",
                data: { accessGranted: true }
            });
        } else {
            // Toggle the access
            const newAccessStatus = !subscription.accessGrantedBySuperAdmin;

            await SubscriptionModel.findByIdAndUpdate(
                subscription._id,
                {
                    accessGrantedBySuperAdmin: newAccessStatus,
                    status: newAccessStatus ? 'active' : 'incomplete'
                }
            );

            return res.status(200).json({
                success: true,
                message: newAccessStatus ? "Subscription access granted successfully" : "Subscription access revoked successfully",
                data: { accessGranted: newAccessStatus }
            });
        }
    } catch (error) {
        console.error('Toggle subscription access error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to toggle subscription access"
        });
    }
});

// Get subscription status for HR-Admin (for super admin view)
exports.getHRAdminSubscriptionStatus = asyncHandler(async (req, res) => {
    try {
        const { hrAdminId } = req.params;

        if (!hrAdminId) {
            return res.status(400).json({
                success: false,
                message: "HR-Admin ID is required"
            });
        }

        // Find the HR-Admin
        const hrAdmin = await HRAdminModel.findById(hrAdminId);
        if (!hrAdmin) {
            return res.status(404).json({
                success: false,
                message: "HR-Admin not found"
            });
        }

        // Find subscription record
        const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdminId });

        const hasAccess = subscription && (
            subscription.status === 'active' ||
            subscription.accessGrantedBySuperAdmin === true
        );

        return res.status(200).json({
            success: true,
            data: {
                hasAccess,
                subscription: subscription || null,
                accessGrantedBySuperAdmin: subscription?.accessGrantedBySuperAdmin || false,
                status: subscription?.status || 'incomplete'
            }
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get subscription status"
        });
    }
});

