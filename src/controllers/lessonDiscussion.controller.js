const { LessonDiscussionThread, LessonDiscussionMessage } = require('../models/lessonDiscussion');
const hrAdminModel = require('../models/hr-admin');
const employeeModel = require('../models/employee');
const supervisorModel = require('../models/supervisor');
const instructorModel = require('../models/instructor');
const subjectModel = require('../models/subject');
const topicModel = require('../models/topic');
const lessonModel = require('../models/LessonsModel');
const authModel = require('../models/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const sanitizeHtml = require('sanitize-html');
const { extractCloudinaryUrls, deleteMultipleFromCloudinary, findRemovedUrls } = require('../utils/cloudinaryCleanup');

// HTML sanitization configuration
const sanitizeOptions = {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ol', 'ul', 'li', 'a', 'img', 'iframe', 'video', 'source'],
    allowedAttributes: {
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height', 'class', 'style'],
        'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'class', 'style'],
        'video': ['src', 'width', 'height', 'controls', 'poster', 'preload', 'class', 'style'],
        'source': ['src', 'type'],
        '*': ['class', 'style']
    },
    allowedStyles: {
        '*': {
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'max-width': [/^\d+(?:px|em|%|rem)$/]
        }
    },
    allowedSchemes: ['http', 'https', 'data'],
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.dailymotion.com', 'player.twitch.tv']
};

// Helper function to check if user can access lesson
const canAccessLesson = async (req, lessonId) => {
    const userType = req.user.userType;
    const userId = req.user._id;

    if (userType === 'HR-Admin') {
        const hrAdmin = await hrAdminModel.findOne({ auth: userId });
        if (!hrAdmin) return { canAccess: false, hrAdmin: null };

        const lesson = await lessonModel.findById(lessonId).populate('topic');
        if (!lesson || !lesson.topic) return { canAccess: false, hrAdmin: null };

        const subject = await subjectModel.findById(lesson.topic.subject);
        if (!subject || subject.createdBy.toString() !== hrAdmin._id.toString()) {
            return { canAccess: false, hrAdmin: null };
        }

        return { canAccess: true, hrAdmin, lesson, subject, topic: lesson.topic };
    }

    if (userType === 'Employee') {
        const employee = await employeeModel.findOne({ auth: userId });
        if (!employee) return { canAccess: false, hrAdmin: null };

        const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
        if (!hrAdmin) return { canAccess: false, hrAdmin: null };

        const lesson = await lessonModel.findById(lessonId).populate('topic');
        if (!lesson || !lesson.topic) return { canAccess: false, hrAdmin: null };

        const subject = await subjectModel.findById(lesson.topic.subject);
        if (!subject || subject.createdBy.toString() !== hrAdmin._id.toString()) {
            return { canAccess: false, hrAdmin: null };
        }

        // Check if employee has access to this subject
        if (!employee.subjects.includes(subject._id)) {
            return { canAccess: false, hrAdmin: null };
        }

        return { canAccess: true, hrAdmin, lesson, subject, topic: lesson.topic };
    }

    if (userType === 'Instructor') {
        const instructor = await instructorModel.findOne({ auth: userId });
        if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
            return { canAccess: false, hrAdmin: null };
        }

        const lesson = await lessonModel.findById(lessonId).populate('topic');
        if (!lesson || !lesson.topic) return { canAccess: false, hrAdmin: null };

        const subject = await subjectModel.findById(lesson.topic.subject);
        if (!subject || !instructor.hrAdmins.includes(subject.createdBy)) {
            return { canAccess: false, hrAdmin: null };
        }

        const hrAdmin = await hrAdminModel.findById(subject.createdBy);
        return { canAccess: true, hrAdmin, lesson, subject, topic: lesson.topic };
    }

    if (userType === 'Supervisor') {
        const supervisor = await supervisorModel.findOne({ auth: userId });
        if (!supervisor || !supervisor.employeeIds || supervisor.employeeIds.length === 0) {
            return { canAccess: false, hrAdmin: null };
        }

        const lesson = await lessonModel.findById(lessonId).populate('topic');
        if (!lesson || !lesson.topic) return { canAccess: false, hrAdmin: null };

        const subject = await subjectModel.findById(lesson.topic.subject);
        if (!subject) return { canAccess: false, hrAdmin: null };

        // Check if any of supervisor's employees have access to this subject
        const employees = await employeeModel.find({ _id: { $in: supervisor.employeeIds } });
        let hasAccess = false;
        let hrAdmin = null;

        for (const employee of employees) {
            const employeeHrAdmin = await hrAdminModel.findOne({ employees: employee._id });
            if (employeeHrAdmin && employeeHrAdmin._id.toString() === subject.createdBy.toString() &&
                employee.subjects.includes(subject._id)) {
                hasAccess = true;
                hrAdmin = employeeHrAdmin;
                break;
            }
        }

        if (!hasAccess) {
            return { canAccess: false, hrAdmin: null };
        }

        return { canAccess: true, hrAdmin, lesson, subject, topic: lesson.topic };
    }

    return { canAccess: false, hrAdmin: null };
};

// Get all subjects for discussion
const getSubjects = asyncHandler(async (req, res) => {
    const userType = req.user.userType;
    const userId = req.user._id;

    let subjects = [];

    if (userType === 'HR-Admin') {
        const hrAdmin = await hrAdminModel.findOne({ auth: userId });
        if (hrAdmin) {
            subjects = await subjectModel.find({ createdBy: hrAdmin._id }).select('name image createdAt');
        }
    } else if (userType === 'Employee') {
        const employee = await employeeModel.findOne({ auth: userId });
        if (employee) {
            const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
            if (hrAdmin) {
                subjects = await subjectModel.find({
                    createdBy: hrAdmin._id,
                    _id: { $in: employee.subjects }
                }).select('name image createdAt');
            }
        }
    } else if (userType === 'Instructor') {
        const instructor = await instructorModel.findOne({ auth: userId });
        if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
            subjects = await subjectModel.find({
                createdBy: { $in: instructor.hrAdmins }
            }).select('name image createdAt');
        }
    } else if (userType === 'Supervisor') {
        const supervisor = await supervisorModel.findOne({ auth: userId });
        if (supervisor && supervisor.employeeIds && supervisor.employeeIds.length > 0) {
            // Get HR-Admins through employees
            const employees = await employeeModel.find({ _id: { $in: supervisor.employeeIds } });
            const hrAdminIds = [];

            for (const employee of employees) {
                const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
                if (hrAdmin && !hrAdminIds.includes(hrAdmin._id.toString())) {
                    hrAdminIds.push(hrAdmin._id);
                }
            }

            if (hrAdminIds.length > 0) {
                subjects = await subjectModel.find({
                    createdBy: { $in: hrAdminIds }
                }).select('name image createdAt');
            }
        }
    }

    res.status(200).json(new ApiResponse(200, subjects, "Subjects retrieved successfully"));
});

// Get topics for a subject
const getTopicsBySubject = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;
    const userType = req.user.userType;
    const userId = req.user._id;

    let topics = [];

    if (userType === 'HR-Admin') {
        const hrAdmin = await hrAdminModel.findOne({ auth: userId });
        if (hrAdmin) {
            const subject = await subjectModel.findOne({ _id: subjectId, createdBy: hrAdmin._id });
            if (subject) {
                topics = await topicModel.find({ subject: subjectId }).select('name image order createdAt').sort({ order: 1 });
            }
        }
    } else if (userType === 'Employee') {
        const employee = await employeeModel.findOne({ auth: userId });
        if (employee) {
            const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
            if (hrAdmin) {
                const subject = await subjectModel.findOne({ _id: subjectId, createdBy: hrAdmin._id });
                if (subject && employee.subjects.includes(subjectId)) {
                    topics = await topicModel.find({ subject: subjectId }).select('name image order createdAt').sort({ order: 1 });
                }
            }
        }
    } else if (userType === 'Instructor') {
        const instructor = await instructorModel.findOne({ auth: userId });
        if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
            const subject = await subjectModel.findOne({
                _id: subjectId,
                createdBy: { $in: instructor.hrAdmins }
            });
            if (subject) {
                topics = await topicModel.find({ subject: subjectId }).select('name image order createdAt').sort({ order: 1 });
            }
        }
    } else if (userType === 'Supervisor') {
        const supervisor = await supervisorModel.findOne({ auth: userId });
        if (supervisor && supervisor.employeeIds && supervisor.employeeIds.length > 0) {
            // Get HR-Admins through employees
            const employees = await employeeModel.find({ _id: { $in: supervisor.employeeIds } });
            const hrAdminIds = [];

            for (const employee of employees) {
                const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
                if (hrAdmin && !hrAdminIds.includes(hrAdmin._id.toString())) {
                    hrAdminIds.push(hrAdmin._id);
                }
            }

            if (hrAdminIds.length > 0) {
                const subject = await subjectModel.findOne({
                    _id: subjectId,
                    createdBy: { $in: hrAdminIds }
                });
                if (subject) {
                    topics = await topicModel.find({ subject: subjectId }).select('name image order createdAt').sort({ order: 1 });
                }
            }
        }
    }

    res.status(200).json(new ApiResponse(200, topics, "Topics retrieved successfully"));
});

// Get lessons for a topic
const getLessonsByTopic = asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const userType = req.user.userType;
    const userId = req.user._id;

    let lessons = [];

    if (userType === 'HR-Admin') {
        const hrAdmin = await hrAdminModel.findOne({ auth: userId });
        if (hrAdmin) {
            const topic = await topicModel.findById(topicId).populate('subject');
            if (topic && topic.subject.createdBy.toString() === hrAdmin._id.toString()) {
                lessons = await lessonModel.find({ topic: topicId }).select('name image order').sort({ order: 1 });
            }
        }
    } else if (userType === 'Employee') {
        const employee = await employeeModel.findOne({ auth: userId });
        if (employee) {
            const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
            if (hrAdmin) {
                const topic = await topicModel.findById(topicId).populate('subject');
                if (topic && topic.subject.createdBy.toString() === hrAdmin._id.toString() &&
                    employee.subjects.includes(topic.subject._id)) {
                    lessons = await lessonModel.find({ topic: topicId }).select('name image order').sort({ order: 1 });
                }
            }
        }
    } else if (userType === 'Instructor') {
        const instructor = await instructorModel.findOne({ auth: userId });
        if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
            const topic = await topicModel.findById(topicId).populate('subject');
            if (topic && instructor.hrAdmins.includes(topic.subject.createdBy)) {
                lessons = await lessonModel.find({ topic: topicId }).select('name image order').sort({ order: 1 });
            }
        }
    } else if (userType === 'Supervisor') {
        const supervisor = await supervisorModel.findOne({ auth: userId });
        if (supervisor && supervisor.employeeIds && supervisor.employeeIds.length > 0) {
            // Get HR-Admins through employees
            const employees = await employeeModel.find({ _id: { $in: supervisor.employeeIds } });
            const hrAdminIds = [];

            for (const employee of employees) {
                const hrAdmin = await hrAdminModel.findOne({ employees: employee._id });
                if (hrAdmin && !hrAdminIds.includes(hrAdmin._id.toString())) {
                    hrAdminIds.push(hrAdmin._id);
                }
            }

            if (hrAdminIds.length > 0) {
                const topic = await topicModel.findById(topicId).populate('subject');
                if (topic && hrAdminIds.some(hrAdminId => hrAdminId.toString() === topic.subject.createdBy.toString())) {
                    lessons = await lessonModel.find({ topic: topicId }).select('name image order').sort({ order: 1 });
                }
            }
        }
    }

    res.status(200).json(new ApiResponse(200, lessons, "Lessons retrieved successfully"));
});

// Get discussion threads for a lesson
const getThreadsByLesson = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    const accessCheck = await canAccessLesson(req, lessonId);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    const { hrAdmin, lesson, subject, topic } = accessCheck;

    // Get all threads for this lesson
    const threads = await LessonDiscussionThread.find({ lesson: lessonId })
        .populate('createdBy', 'fullName image')
        .sort({ createdAt: -1 });

    // Get all reply messages for these threads (excluding the initial thread message)
    const threadIds = threads.map(t => t._id);
    const messages = await LessonDiscussionMessage.find({ thread: { $in: threadIds } })
        .populate('sender', 'fullName image')
        .populate('parent')
        .sort({ createdAt: 1 });

    // Group messages by thread
    const messagesByThread = {};
    messages.forEach(msg => {
        if (!messagesByThread[msg.thread.toString()]) {
            messagesByThread[msg.thread.toString()] = [];
        }
        messagesByThread[msg.thread.toString()].push(msg);
    });

    // Attach messages to threads
    const threadsWithMessages = threads.map(thread => ({
        ...thread.toObject(),
        messages: messagesByThread[thread._id.toString()] || [],
        lesson: { _id: lesson._id, name: lesson.name },
        subject: { _id: subject._id, name: subject.name },
        topic: { _id: topic._id, name: topic.name }
    }));

    res.status(200).json(new ApiResponse(200, threadsWithMessages, "Threads retrieved successfully"));
});

// Create a new discussion thread
const createThread = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { title, text } = req.body;

    if (!title || !text) {
        return res.status(400).json(new ApiError(400, "Title and text are required"));
    }

    const accessCheck = await canAccessLesson(req, lessonId);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    const { hrAdmin, lesson, subject, topic } = accessCheck;

    // Sanitize HTML content
    const sanitizedText = sanitizeHtml(text.trim(), sanitizeOptions);

    // Create thread with message
    const thread = await LessonDiscussionThread.create({
        title: title.trim(),
        message: sanitizedText,
        lesson: lessonId,
        subject: subject._id,
        topic: topic._id,
        hrAdmin: hrAdmin._id,
        employees: hrAdmin.employees || [],
        createdBy: req.user._id
    });

    // Populate and return
    const populatedThread = await LessonDiscussionThread.findById(thread._id)
        .populate('createdBy', 'fullName image');

    res.status(201).json(new ApiResponse(201, populatedThread, "Thread created successfully"));
});

// Get messages for a thread
const getMessagesByThread = asyncHandler(async (req, res) => {
    const { threadId } = req.params;

    const thread = await LessonDiscussionThread.findById(threadId);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    const messages = await LessonDiscussionMessage.find({ thread: threadId })
        .populate('sender', 'fullName image')
        .populate('parent')
        .sort({ createdAt: 1 });

    res.status(200).json(new ApiResponse(200, messages, "Messages retrieved successfully"));
});

// Create a message (reply to thread or another message)
const createMessage = asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { text, parentId } = req.body;

    if (!text) {
        return res.status(400).json(new ApiError(400, "Text is required"));
    }

    const thread = await LessonDiscussionThread.findById(threadId);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    // If parentId is provided, verify it exists and belongs to this thread
    if (parentId) {
        const parentMessage = await LessonDiscussionMessage.findOne({
            _id: parentId,
            thread: threadId
        });
        if (!parentMessage) {
            return res.status(400).json(new ApiError(400, "Invalid parent message"));
        }
    }

    // Sanitize HTML content
    const sanitizedText = sanitizeHtml(text.trim(), sanitizeOptions);

    const message = await LessonDiscussionMessage.create({
        thread: threadId,
        sender: req.user._id,
        text: sanitizedText,
        parent: parentId || null
    });

    const populatedMessage = await LessonDiscussionMessage.findById(message._id)
        .populate('sender', 'fullName image')
        .populate('parent');

    res.status(201).json(new ApiResponse(201, populatedMessage, "Message created successfully"));
});

// Update a thread (only by creator)
const updateThread = asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { title, message } = req.body;

    if (!title && !message) {
        return res.status(400).json(new ApiError(400, "Title or message is required"));
    }

    const thread = await LessonDiscussionThread.findById(threadId);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    if (thread.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiError(403, "Only the creator can update this thread"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    // If message is being updated, find and delete removed media
    if (message) {
        const oldMessage = thread.message;
        const newMessage = sanitizeHtml(message.trim(), sanitizeOptions);

        // Find URLs that were removed
        const removedUrls = findRemovedUrls(oldMessage, newMessage);

        // Delete removed media from Cloudinary (don't wait)
        if (removedUrls.length > 0) {
            deleteMultipleFromCloudinary(removedUrls).catch(() => {
                // Silently handle errors
            });
        }

        thread.message = newMessage;
    }

    if (title) thread.title = title.trim();

    await thread.save();

    const populatedThread = await LessonDiscussionThread.findById(thread._id)
        .populate('createdBy', 'fullName image');

    res.status(200).json(new ApiResponse(200, populatedThread, "Thread updated successfully"));
});

// Delete a thread (only by creator)
const deleteThread = asyncHandler(async (req, res) => {
    const { threadId } = req.params;

    const thread = await LessonDiscussionThread.findById(threadId);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    if (thread.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiError(403, "Only the creator can delete this thread"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    // Extract and delete Cloudinary media from thread message
    const threadUrls = extractCloudinaryUrls(thread.message);

    // Get all messages in this thread
    const messages = await LessonDiscussionMessage.find({ thread: threadId });

    // Extract Cloudinary URLs from all messages
    const messageUrls = messages.flatMap(msg => extractCloudinaryUrls(msg.text));

    // Combine all URLs
    const allUrls = [...threadUrls, ...messageUrls];

    // Delete from Cloudinary (don't wait for it to complete)
    if (allUrls.length > 0) {
        deleteMultipleFromCloudinary(allUrls).catch(() => {
            // Silently handle errors - deletion failure shouldn't block thread deletion
        });
    }

    // Delete all messages in this thread
    await LessonDiscussionMessage.deleteMany({ thread: threadId });

    // Delete the thread
    await LessonDiscussionThread.findByIdAndDelete(threadId);

    res.status(200).json(new ApiResponse(200, null, "Thread deleted successfully"));
});

// Update a message (only by sender)
const updateMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json(new ApiError(400, "Text is required"));
    }

    const message = await LessonDiscussionMessage.findById(messageId);
    if (!message) {
        return res.status(404).json(new ApiError(404, "Message not found"));
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiError(403, "Only the sender can update this message"));
    }

    const thread = await LessonDiscussionThread.findById(message.thread);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    // Store old text for comparison
    const oldText = message.text;
    const newText = sanitizeHtml(text.trim(), sanitizeOptions);

    // Find URLs that were removed
    const removedUrls = findRemovedUrls(oldText, newText);

    // Delete removed media from Cloudinary (don't wait)
    if (removedUrls.length > 0) {
        deleteMultipleFromCloudinary(removedUrls).catch(() => {
            // Silently handle errors
        });
    }

    // Sanitize HTML content
    message.text = newText;
    await message.save();

    const populatedMessage = await LessonDiscussionMessage.findById(message._id)
        .populate('sender', 'fullName image')
        .populate('parent');

    res.status(200).json(new ApiResponse(200, populatedMessage, "Message updated successfully"));
});

// Delete a message (only by sender)
const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await LessonDiscussionMessage.findById(messageId);
    if (!message) {
        return res.status(404).json(new ApiError(404, "Message not found"));
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json(new ApiError(403, "Only the sender can delete this message"));
    }

    const thread = await LessonDiscussionThread.findById(message.thread);
    if (!thread) {
        return res.status(404).json(new ApiError(404, "Thread not found"));
    }

    const accessCheck = await canAccessLesson(req, thread.lesson);
    if (!accessCheck.canAccess) {
        return res.status(403).json(new ApiError(403, "Access denied"));
    }

    // Extract Cloudinary URLs from this message
    const messageUrls = extractCloudinaryUrls(message.text);

    // Get all replies to this message
    const replies = await LessonDiscussionMessage.find({ parent: messageId });

    // Extract Cloudinary URLs from all replies
    const replyUrls = replies.flatMap(reply => extractCloudinaryUrls(reply.text));

    // Combine all URLs
    const allUrls = [...messageUrls, ...replyUrls];

    // Delete from Cloudinary (don't wait for it to complete)
    if (allUrls.length > 0) {
        deleteMultipleFromCloudinary(allUrls).catch(() => {
            // Silently handle errors
        });
    }

    // Delete all replies to this message
    await LessonDiscussionMessage.deleteMany({ parent: messageId });

    // Delete the message
    await LessonDiscussionMessage.findByIdAndDelete(messageId);

    res.status(200).json(new ApiResponse(200, null, "Message deleted successfully"));
});

module.exports = {
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
};
