const mongoose = require('mongoose');

const superAdminControlsSchema = new mongoose.Schema({
    globalSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
    }],
    globalTopics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
    }],
    globalLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lessons",
    }],
    globalQuizzes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quizes",
    }],
}, { timestamps: true });

const SuperAdminControlsModel = mongoose.models.SuperAdminControls || mongoose.model('SuperAdminControls', superAdminControlsSchema);
module.exports = SuperAdminControlsModel;


