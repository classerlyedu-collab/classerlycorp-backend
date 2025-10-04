const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const hrAdminInstructorRequestSchema = new Schema(
    {
        hrAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HR-Admin",
        },
        status: {
            type: String,
            enum: ["Pending", "Complete", "Rejected"],
            default: "Pending",
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
        },
        subjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "subject",
        }],
    },
    {
        timestamps: true,
    }
);

const hrAdminInstructorRequestModel = mongoose.models.hrAdminInstructorRequest || mongoose.model(
    "hrAdminInstructorRequest",
    hrAdminInstructorRequestSchema
);
module.exports = hrAdminInstructorRequestModel;


