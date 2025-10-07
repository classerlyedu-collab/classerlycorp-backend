const mongoose = require('mongoose');

const LessonDiscussionThreadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lessons', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    hrAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'HR-Admin', required: true, index: true },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'auth', required: true },
}, { timestamps: true });

const LessonDiscussionMessageSchema = new mongoose.Schema({
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonDiscussionThread', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'auth', required: true },
    text: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonDiscussionMessage', default: null },
}, { timestamps: true });

const LessonDiscussionThread = mongoose.models.LessonDiscussionThread || mongoose.model('LessonDiscussionThread', LessonDiscussionThreadSchema);
const LessonDiscussionMessage = mongoose.models.LessonDiscussionMessage || mongoose.model('LessonDiscussionMessage', LessonDiscussionMessageSchema);

module.exports = { LessonDiscussionThread, LessonDiscussionMessage };
