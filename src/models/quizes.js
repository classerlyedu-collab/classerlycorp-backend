const mongoose = require('mongoose');

const quizesSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HR-Admin"
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions"
    }],
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic"
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lessons"
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject"
    },
    type: {
        type: String,
        enum: ["universal", "private"],
        default: "universal"
    },
    startsAt: {
        type: Date
    },
    endsAt: {
        type: Date
    },
    image: { type: String, default: process.env.DEFAULT_QUIZ_IMAGE },

    status: {
        type: String,
        enum: ["pending", "start", "complete"],
        default: "pending",
    },
    score: Number
}, {
    timestamps: true
})

const QuizesModel = mongoose.model("Quizes", quizesSchema);
module.exports = QuizesModel;