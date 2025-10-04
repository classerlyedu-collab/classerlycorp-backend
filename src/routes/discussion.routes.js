const { Router } = require('express');
const { verifytoken } = require('../middlewares/auth');
const { createThread, listThreads, getThread, updateThread, deleteThread, listMessages, addMessage, updateMessage, deleteMessage, listRecentMessages } = require('../controllers/discussion.controller');

const router = Router();

// Create a discussion thread (HR-Admin or Employee)
router.route('/threads').post(verifytoken, createThread);

// List threads visible to current user
router.route('/threads').get(verifytoken, listThreads);

// Get a single thread
router.route('/threads/:threadId').get(verifytoken, getThread);

// Update/Delete thread (author only enforced in controller)
router.route('/threads/:threadId').put(verifytoken, updateThread);
router.route('/threads/:threadId').delete(verifytoken, deleteThread);

// Messages
router.route('/threads/:threadId/messages').get(verifytoken, listMessages);
router.route('/threads/:threadId/messages').post(verifytoken, addMessage);

// Update/Delete message (author only)
router.route('/messages/:messageId').put(verifytoken, updateMessage);
router.route('/messages/:messageId').delete(verifytoken, deleteMessage);

// Feed
router.route('/feed').get(verifytoken, listRecentMessages);

module.exports = router;


