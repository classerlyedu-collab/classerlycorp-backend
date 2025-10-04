const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const lessonsSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    image: String,
    content: {
        type: String
    },
    contentType: {
        type: String,
        enum: ['google_docs', 'youtube'],
        default: 'google_docs'
    },
    words: Number,
    lang: {
        type: String,
        default: "Eng"
    },
    pages: Number,
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HR-Admin",
        required: true,
    },
    // User-specific progress tracking
    userProgress: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        notes: {
            type: String,
            default: ""
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
})

const LessonsModel = mongoose.model("Lessons", lessonsSchema);
module.exports = LessonsModel;
