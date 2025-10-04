const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const discussionMessageSchema = new Schema({
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionThread', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'auth', required: true },
    senderType: { type: String, enum: ['HR-Admin', 'Employee', 'Supervisor', 'Instructor'], required: true },
    text: { type: String, trim: true },
    // Optional parent message for replies
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionMessage' },
    attachments: [{
        url: String,
        name: String,
        type: String,
        size: Number
    }]
}, { timestamps: true });

const DiscussionMessage = mongoose.models.DiscussionMessage || mongoose.model('DiscussionMessage', discussionMessageSchema);
module.exports = DiscussionMessage;


