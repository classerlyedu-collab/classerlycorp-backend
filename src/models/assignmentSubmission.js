const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const assignmentSubmissionSchema = new Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileMetadata: {
            publicId: String,
            resourceType: { type: String, default: 'raw' },
            size: Number,
            uploadedAt: { type: Date, default: Date.now },
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["submitted", "graded", "returned"],
            default: "submitted",
        },
        grade: {
            score: Number,
            maxScore: Number,
            percentage: Number,
            feedback: String,
            gradedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "auth",
            },
            gradedAt: Date,
        },
        comments: [
            {
                text: String,
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "auth",
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
assignmentSubmissionSchema.index({ assignment: 1, employee: 1 });
assignmentSubmissionSchema.index({ assignment: 1, status: 1 });
assignmentSubmissionSchema.index({ employee: 1, status: 1 });
assignmentSubmissionSchema.index({ submittedAt: -1 });

const assignmentSubmissionModel = mongoose.models.AssignmentSubmission || mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
module.exports = assignmentSubmissionModel;

