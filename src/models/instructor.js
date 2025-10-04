const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const instructorSchema = new Schema(
    {
        auth: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
        },
        code: {
            type: String,
            unique: true,
            index: true
        },
        hrAdmins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "HR-Admin",
            },
        ],
        subjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "subject",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const InstructorModel = mongoose.models["Instructor"] || mongoose.model("Instructor", instructorSchema);
module.exports = InstructorModel;


