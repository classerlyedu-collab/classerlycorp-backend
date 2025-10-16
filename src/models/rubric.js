const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const criterionSchema = new Schema({
    criterion: {
        type: String,
        required: true,
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    maxScore: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        default: "",
    },
});

const rubricSchema = new Schema(
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
        criteria: {
            type: [criterionSchema],
            required: true,
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: "At least one criterion is required",
            },
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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
rubricSchema.index({ createdBy: 1, isActive: 1 });
rubricSchema.index({ hrAdmin: 1, isActive: 1 });
rubricSchema.index({ instructor: 1, isActive: 1 });

const rubricModel = mongoose.models.Rubric || mongoose.model("Rubric", rubricSchema);
module.exports = rubricModel;

