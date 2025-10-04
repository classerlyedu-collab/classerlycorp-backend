const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Discussion thread scoped to an HR-Admin org or subset of employees
const discussionThreadSchema = new Schema({
    title: { type: String, required: true, trim: true },

    // Owner org scope
    hrAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'HR-Admin', required: true },

    // Optional restriction to specific employees; if empty, all employees under hrAdmin are allowed
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],

    // Optional academic context
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lessons' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'auth', required: true },
}, { timestamps: true });

const DiscussionThread = mongoose.models.DiscussionThread || mongoose.model('DiscussionThread', discussionThreadSchema);
module.exports = DiscussionThread;


