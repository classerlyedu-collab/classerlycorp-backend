const asyncHandler = require('../utils/asyncHandler');
const DiscussionThread = require('../models/discussionThread');
const DiscussionMessage = require('../models/discussionMessage');
const HRAdminModel = require('../models/hr-admin');
const InstructorModel = require('../models/instructor');
const EmployeeModel = require('../models/employee');
const SupervisorModel = require('../models/supervisor');

// Helper: ensure user can access a thread
const userCanAccessThread = async (user, thread) => {
    const role = user.userType;

    if (role === 'HR-Admin') {
        const hrAdminId = user?.profile?._id || user?.profile;
        return String(thread.hrAdmin) === String(hrAdminId);
    }

    if (role === 'Employee') {
        const employeeId = user?.profile?._id || user?.profile;

        // First check if employee is linked to any HR-Admin
        const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
        if (!hrAdmin) return false;

        return thread.employees?.some((e) => String(e) === String(employeeId));
    }

    if (role === 'Supervisor') {
        const supervisorId = user?.profile?._id || user?.profile;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) return false;
        const employeeSet = new Set((supervisor.employeeIds || []).map((id) => String(id)));
        return (thread.employees || []).some((e) => employeeSet.has(String(e)));
    }

    if (role === 'Instructor') {
        // Allow instructor if they are linked to the HR-Admin of the thread
        const instructorId = user?.profile?._id || user?.profile;
        const instructor = await InstructorModel.findById(instructorId);
        if (!instructor) return false;
        return String(thread.hrAdmin) && (instructor.hrAdmins || []).some((h) => String(h) === String(thread.hrAdmin));
    }

    return false;
};

exports.createThread = asyncHandler(async (req, res) => {
    try {
        const { title, employees = [], subject, topic, lesson, text } = req.body;
        if (!title || !title.trim()) {
            return res.status(200).json({ success: false, message: 'Title is required' });
        }

        const role = req.user.userType;
        let hrAdminId;
        let participants = [];

        if (role === 'HR-Admin') {
            hrAdminId = req.user?.profile?._id || req.user?.profile;
            // Validate employees belong to this HR-Admin
            const hr = await HRAdminModel.findById(hrAdminId).select('employees');
            if (!hr) return res.status(200).json({ success: false, message: 'HR-Admin not found' });
            const allowed = new Set((hr.employees || []).map((e) => String(e)));
            // If HR-Admin did not provide employees, default to all their employees
            if (!employees || employees.length === 0) {
                participants = hr.employees || [];
            } else {
                for (const emp of employees) {
                    if (!allowed.has(String(emp))) {
                        return res.status(200).json({ success: false, message: 'One or more employees are not under your management' });
                    }
                }
                participants = employees;
            }
        } else if (role === 'Employee') {
            const employeeId = req.user?.profile?._id || req.user?.profile;
            // Find HR-Admin that manages this employee
            const hr = await HRAdminModel.findOne({ employees: employeeId }).select('_id');
            if (!hr) return res.status(200).json({ success: false, message: 'No HR-Admin associated with this employee' });
            hrAdminId = hr._id;
            participants = [employeeId];
        } else if (role === 'Supervisor') {
            const supervisorId = req.user?.profile?._id || req.user?.profile;
            const supervisor = await SupervisorModel.findById(supervisorId).select('employeeIds');
            if (!supervisor) return res.status(200).json({ success: false, message: 'Supervisor not found' });

            // If employees provided, ensure they are a subset of supervisor's employeeIds; otherwise default to all supervisor employees
            const supSet = new Set((supervisor.employeeIds || []).map((id) => String(id)));
            let chosenEmployees = employees && employees.length > 0 ? employees : (supervisor.employeeIds || []);
            chosenEmployees = chosenEmployees.filter((e) => supSet.has(String(e)));
            if (chosenEmployees.length === 0) {
                return res.status(200).json({ success: false, message: 'Supervisor has no linked employees to start a discussion' });
            }

            // Determine HR-Admin by ensuring all chosen employees belong to the same HR-Admin
            const firstEmp = chosenEmployees[0];
            const hr = await HRAdminModel.findOne({ employees: firstEmp }).select('_id employees');
            if (!hr) return res.status(200).json({ success: false, message: 'No HR-Admin found for selected employees' });
            const hrSet = new Set((hr.employees || []).map((id) => String(id)));
            const allUnderSameHR = chosenEmployees.every((e) => hrSet.has(String(e)));
            if (!allUnderSameHR) {
                return res.status(200).json({ success: false, message: 'All selected employees must be under the same HR-Admin' });
            }

            hrAdminId = hr._id;
            participants = chosenEmployees;
        } else if (role === 'Instructor') {
            // Instructors can create discussions under a linked HR-Admin
            const instructorId = req.user?.profile?._id || req.user?.profile;
            const instructor = await InstructorModel.findById(instructorId).select('hrAdmins');
            if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
                return res.status(200).json({ success: false, message: 'No linked HR-Admin found for instructor' });
            }

            // Use the first linked HR-Admin by default
            hrAdminId = instructor.hrAdmins[0];
            const hr = await HRAdminModel.findById(hrAdminId).select('employees');
            if (!hr) return res.status(200).json({ success: false, message: 'HR-Admin not found' });

            // If employees provided, they must be managed by this HR-Admin; else default to all
            const allowed = new Set((hr.employees || []).map((e) => String(e)));
            if (!employees || employees.length === 0) {
                participants = hr.employees || [];
            } else {
                for (const emp of employees) {
                    if (!allowed.has(String(emp))) {
                        return res.status(200).json({ success: false, message: 'One or more employees are not under your linked HR-Admin' });
                    }
                }
                participants = employees;
            }
        } else {
            return res.status(403).json({ success: false, message: 'Only HR-Admin, Employee, or Supervisor can create discussions' });
        }

        const thread = await DiscussionThread.create({
            title: title.trim(),
            hrAdmin: hrAdminId,
            employees: participants,
            subject: subject || undefined,
            topic: topic || undefined,
            lesson: lesson || undefined,
            createdBy: req.user._id
        });

        // Optionally create initial message (post)
        let initialMessage = null;
        if (text && String(text).trim().length > 0) {
            initialMessage = await DiscussionMessage.create({
                thread: thread._id,
                sender: req.user._id,
                senderType: req.user.userType,
                text: String(text).trim()
            });
        }

        const populated = await DiscussionThread.findById(thread._id)
            .populate('hrAdmin', 'auth')
            .populate('employees', 'auth')
            .populate('subject', 'name image')
            .populate('topic', 'name image')
            .populate('lesson', 'name image');

        return res.status(200).json({ success: true, data: populated, message: 'Discussion thread created', initialMessageId: initialMessage?._id });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to create thread' });
    }
});

exports.listThreads = asyncHandler(async (req, res) => {
    try {
        const role = req.user.userType;
        let filter = {};

        if (role === 'HR-Admin') {
            const hrAdminId = req.user?.profile?._id || req.user?.profile;
            filter = { hrAdmin: hrAdminId };
        } else if (role === 'Employee') {
            const employeeId = req.user?.profile?._id || req.user?.profile;

            // First check if employee is linked to any HR-Admin
            const hrAdmin = await HRAdminModel.findOne({ employees: employeeId });
            if (!hrAdmin) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: "No discussions available. You are not linked to any HR-Admin."
                });
            }

            filter = { employees: employeeId };
        } else if (role === 'Supervisor') {
            const supervisorId = req.user?.profile?._id || req.user?.profile;
            const supervisor = await SupervisorModel.findById(supervisorId).select('employeeIds');
            if (!supervisor) return res.status(200).json({ success: true, data: [] });
            filter = { employees: { $in: supervisor.employeeIds || [] } };
        } else if (role === 'Instructor') {
            const instructorId = req.user?.profile?._id || req.user?.profile;
            const instructor = await InstructorModel.findById(instructorId).select('hrAdmins');
            if (!instructor) return res.status(200).json({ success: true, data: [] });
            filter = { hrAdmin: { $in: instructor.hrAdmins || [] } };
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized role' });
        }

        const threads = await DiscussionThread.find(filter)
            .sort({ updatedAt: -1 })
            .populate('subject', 'name image')
            .populate('topic', 'name image')
            .populate('lesson', 'name image')
            .populate('employees', 'auth')
            .populate('hrAdmin', 'auth');

        return res.status(200).json({ success: true, data: threads });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to list threads' });
    }
});

exports.getThread = asyncHandler(async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await DiscussionThread.findById(threadId)
            .populate('subject', 'name image')
            .populate('topic', 'name image')
            .populate('lesson', 'name image')
            .populate('employees', 'auth')
            .populate('hrAdmin', 'auth');
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        const allowed = await userCanAccessThread(req.user, thread);
        if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

        return res.status(200).json({ success: true, data: thread });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to fetch thread' });
    }
});

// Update thread (author only)
exports.updateThread = asyncHandler(async (req, res) => {
    try {
        const { threadId } = req.params;
        const { title, subject, topic, lesson } = req.body;
        const thread = await DiscussionThread.findById(threadId);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        if (String(thread.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only the author can update this thread' });
        }

        const update = {};
        if (title && String(title).trim()) update.title = String(title).trim();
        if (typeof subject !== 'undefined') update.subject = subject || undefined;
        if (typeof topic !== 'undefined') update.topic = topic || undefined;
        if (typeof lesson !== 'undefined') update.lesson = lesson || undefined;

        const updated = await DiscussionThread.findByIdAndUpdate(threadId, { $set: update }, { new: true })
            .populate('subject', 'name image')
            .populate('topic', 'name image')
            .populate('lesson', 'name image');

        return res.status(200).json({ success: true, data: updated, message: 'Thread updated' });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to update thread' });
    }
});

// Delete thread (author only)
exports.deleteThread = asyncHandler(async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await DiscussionThread.findById(threadId);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        if (String(thread.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only the author can delete this thread' });
        }

        await DiscussionMessage.deleteMany({ thread: threadId });
        await DiscussionThread.findByIdAndDelete(threadId);
        return res.status(200).json({ success: true, message: 'Thread deleted' });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to delete thread' });
    }
});

exports.listMessages = asyncHandler(async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await DiscussionThread.findById(threadId).select('hrAdmin employees');
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        const allowed = await userCanAccessThread(req.user, thread);
        if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

        const messages = await DiscussionMessage.find({ thread: threadId })
            .sort({ createdAt: 1 })
            .populate('sender', 'fullName userName image')
            .populate('parent', '_id');

        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to list messages' });
    }
});

exports.addMessage = asyncHandler(async (req, res) => {
    try {
        const { threadId } = req.params;
        const { text, parent } = req.body;
        if (!text || !text.trim()) {
            return res.status(200).json({ success: false, message: 'Message text is required' });
        }

        const thread = await DiscussionThread.findById(threadId);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        const allowed = await userCanAccessThread(req.user, thread);
        if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

        const message = await DiscussionMessage.create({
            thread: thread._id,
            sender: req.user._id,
            senderType: req.user.userType,
            text: text.trim(),
            parent: parent || undefined
        });

        // Update thread updatedAt for sorting
        await DiscussionThread.findByIdAndUpdate(thread._id, { $set: { updatedAt: new Date() } });

        const populated = await DiscussionMessage.findById(message._id)
            .populate('sender', 'fullName userName image')
            .populate('parent', '_id');

        // Socket removed for discussions per latest requirement

        return res.status(200).json({ success: true, data: populated, message: 'Message sent' });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to send message' });
    }
});

// Update message (author only)
exports.updateMessage = asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        if (!text || !String(text).trim()) return res.status(200).json({ success: false, message: 'Message text is required' });

        const msg = await DiscussionMessage.findById(messageId);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        if (String(msg.sender) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only the author can update this message' });
        }

        await DiscussionMessage.findByIdAndUpdate(messageId, { $set: { text: String(text).trim() } });
        const populated = await DiscussionMessage.findById(messageId)
            .populate('sender', 'fullName userName image')
            .populate('parent', '_id');
        return res.status(200).json({ success: true, data: populated, message: 'Message updated' });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to update message' });
    }
});

// Delete message (author only)
exports.deleteMessage = asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const msg = await DiscussionMessage.findById(messageId);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        if (String(msg.sender) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only the author can delete this message' });
        }

        await DiscussionMessage.findByIdAndDelete(messageId);
        return res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to delete message' });
    }
});

// List recent messages across all visible threads (feed)
exports.listRecentMessages = asyncHandler(async (req, res) => {
    try {
        const role = req.user.userType;
        let filter = {};

        if (role === 'HR-Admin') {
            const hrAdminId = req.user?.profile?._id || req.user?.profile;
            filter = { hrAdmin: hrAdminId };
        } else if (role === 'Employee') {
            const employeeId = req.user?.profile?._id || req.user?.profile;

            // First check if employee is linked to any HR-Admin
            const hrAdmin = await HRAdminModel.findOne({ employees: employeeId });
            if (!hrAdmin) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: "No discussions available. You are not linked to any HR-Admin."
                });
            }

            filter = { employees: employeeId };
        } else if (role === 'Supervisor') {
            const supervisorId = req.user?.profile?._id || req.user?.profile;
            const supervisor = await SupervisorModel.findById(supervisorId).select('employeeIds');
            if (!supervisor) return res.status(200).json({ success: true, data: [] });
            filter = { employees: { $in: supervisor.employeeIds || [] } };
        } else if (role === 'Instructor') {
            const instructorId = req.user?.profile?._id || req.user?.profile;
            const instructor = await InstructorModel.findById(instructorId).select('hrAdmins');
            if (!instructor) return res.status(200).json({ success: true, data: [] });
            filter = { hrAdmin: { $in: instructor.hrAdmins || [] } };
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized role' });
        }

        const threads = await DiscussionThread.find(filter).select('_id title subject topic lesson hrAdmin employees');
        const threadIds = threads.map(t => t._id);
        if (threadIds.length === 0) return res.status(200).json({ success: true, data: [] });

        const messages = await DiscussionMessage.find({ thread: { $in: threadIds } })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('sender', 'fullName userName image')
            .populate('parent', '_id')
            .populate({
                path: 'thread', select: 'title subject topic lesson hrAdmin employees', populate: [
                    { path: 'subject', select: 'name image' },
                    { path: 'topic', select: 'name image' },
                    { path: 'lesson', select: 'name image' }
                ]
            });

        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message || 'Failed to load feed' });
    }
});


