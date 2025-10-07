const express = require('express');
const router = express.Router();
const { verifytoken } = require('../middlewares/auth');
const {
    getSubjects,
    getTopicsBySubject,
    getLessonsByTopic,
    getThreadsByLesson,
    createThread,
    getMessagesByThread,
    createMessage,
    updateThread,
    deleteThread,
    updateMessage,
    deleteMessage
} = require('../controllers/lessonDiscussion.controller');

// Get all subjects for discussion
router.get('/subjects', verifytoken, getSubjects);

// Get topics for a subject
router.get('/subjects/:subjectId/topics', verifytoken, getTopicsBySubject);

// Get lessons for a topic
router.get('/topics/:topicId/lessons', verifytoken, getLessonsByTopic);

// Get discussion threads for a lesson
router.get('/lessons/:lessonId/threads', verifytoken, getThreadsByLesson);

// Create a new discussion thread
router.post('/lessons/:lessonId/threads', verifytoken, createThread);

// Get messages for a thread
router.get('/threads/:threadId/messages', verifytoken, getMessagesByThread);

// Create a message (reply to thread or another message)
router.post('/threads/:threadId/messages', verifytoken, createMessage);

// Update a thread (only by creator)
router.put('/threads/:threadId', verifytoken, updateThread);

// Delete a thread (only by creator)
router.delete('/threads/:threadId', verifytoken, deleteThread);

// Update a message (only by sender)
router.put('/messages/:messageId', verifytoken, updateMessage);

// Delete a message (only by sender)
router.delete('/messages/:messageId', verifytoken, deleteMessage);

module.exports = router;
