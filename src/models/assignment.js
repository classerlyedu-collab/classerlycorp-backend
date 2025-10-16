const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const assignmentSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        deadline: {
            type: Date,
            required: true,
        },
        attachedRubric: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rubric",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
            required: true,
        },
        hrAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HR-Admin",
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
        },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subject",
        },
        attachments: [
            {
                filename: String,
                url: String,
                publicId: String,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "published",
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
assignmentSchema.index({ createdBy: 1, isActive: 1 });
assignmentSchema.index({ hrAdmin: 1, isActive: 1 });
assignmentSchema.index({ instructor: 1, isActive: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ subject: 1 });

const assignmentModel = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
module.exports = assignmentModel;

