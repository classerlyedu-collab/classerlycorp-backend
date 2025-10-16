const assignmentModel = require("../models/assignment");
const rubricModel = require("../models/rubric");
const hrAdminModel = require("../models/hr-admin");
const InstructorModel = require("../models/instructor");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// Get all assignments for the current user
exports.getAllAssignments = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.userType;
        const { subject, status } = req.query;

        let query = { isActive: true };

        // Filter based on user role
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId }).populate("instructors");
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }

            // Get assignments created by this HR-Admin OR any of their instructors
            const instructorIds = hrAdmin.instructors.map(inst => inst._id);
            query.$or = [
                { hrAdmin: hrAdmin._id },
                { instructor: { $in: instructorIds } }
            ];
        } else if (userType === "Instructor") {
            const instructor = await InstructorModel.findOne({ auth: userId }).populate("hrAdmins");
            if (!instructor) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor profile not found",
                });
            }

            // Get assignments created by this Instructor OR any of their linked HR-Admins
            const hrAdminIds = instructor.hrAdmins.map(hr => hr._id);
            query.$or = [
                { instructor: instructor._id },
                { hrAdmin: { $in: hrAdminIds } }
            ];
        } else if (userType === "Employee") {
            // Employees can view assignments from their HR-Admin and linked instructors
            const employeeModel = require("../models/employee");
            const employee = await employeeModel.findOne({ auth: userId });
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: "Employee profile not found",
                });
            }

            // Find the HR-Admin this employee belongs to
            const hrAdmin = await hrAdminModel.findOne({ employees: employee._id }).populate("instructors");
            if (!hrAdmin) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: "No assignments available. You are not linked to any HR-Admin.",
                });
            }

            // Get assignments from HR-Admin and their instructors
            const instructorIds = (hrAdmin.instructors || []).map(inst => inst._id);
            query.$or = [
                { hrAdmin: hrAdmin._id },
                { instructor: { $in: instructorIds } }
            ];

            // Only show published assignments to employees
            query.status = "published";
        }

        // Additional filters
        if (subject) {
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { subject }];
                delete query.$or;
            } else {
                query.subject = subject;
            }
        }
        if (status && userType !== "Employee") query.status = status; // Employees can only see published

        const assignments = await assignmentModel
            .find(query)
            .populate("createdBy", "fullName email")
            .populate("attachedRubric") // Populate full rubric with all fields including criteria
            .populate("subject", "name")
            .sort({ deadline: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: assignments,
            message: "Assignments retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve assignments",
        });
    }
});

// Get single assignment by ID
exports.getAssignmentById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userType = req.user.userType;

        const assignment = await assignmentModel
            .findOne({ _id: id, isActive: true })
            .populate("createdBy", "fullName email")
            .populate("attachedRubric")
            .populate("subject", "name");

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        // Verify access rights
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId }).populate("instructors");
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }

            // HR-Admin can access assignments created by themselves OR their linked instructors
            const instructorIds = (hrAdmin.instructors || []).map(inst => inst._id.toString());
            const isOwnAssignment = assignment.hrAdmin?.toString() === hrAdmin._id.toString();
            const isInstructorAssignment = assignment.instructor && instructorIds.includes(assignment.instructor.toString());

            if (!isOwnAssignment && !isInstructorAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to access this assignment",
                });
            }
        } else if (userType === "Instructor") {
            const instructor = await InstructorModel.findOne({ auth: userId }).populate("hrAdmins");
            if (!instructor) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor profile not found",
                });
            }

            // Instructor can access assignments created by themselves OR their linked HR-Admins
            const hrAdminIds = (instructor.hrAdmins || []).map(hr => hr._id.toString());
            const isOwnAssignment = assignment.instructor?.toString() === instructor._id.toString();
            const isHrAdminAssignment = assignment.hrAdmin && hrAdminIds.includes(assignment.hrAdmin.toString());

            if (!isOwnAssignment && !isHrAdminAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to access this assignment",
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: assignment,
            message: "Assignment retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve assignment",
        });
    }
});

// Create new assignment
exports.createAssignment = asyncHandler(async (req, res) => {
    try {
        const { title, description, deadline, attachedRubric, subject, attachments, status } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        // Validation
        if (!title || !description || !deadline) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and deadline are required",
            });
        }

        // Validate deadline
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid deadline date",
            });
        }

        // Validate rubric if provided
        if (attachedRubric) {
            const rubric = await rubricModel.findOne({ _id: attachedRubric, isActive: true });
            if (!rubric) {
                return res.status(404).json({
                    success: false,
                    message: "Attached rubric not found",
                });
            }
        }

        // Prepare assignment data
        const assignmentData = {
            title,
            description,
            deadline: deadlineDate,
            createdBy: userId,
            status: status || "published",
        };

        if (attachedRubric) assignmentData.attachedRubric = attachedRubric;
        if (subject) assignmentData.subject = subject;
        if (attachments) assignmentData.attachments = attachments;

        // Set hrAdmin or instructor based on user type
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId });
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }
            assignmentData.hrAdmin = hrAdmin._id;
        } else if (userType === "Instructor") {
            const instructor = await InstructorModel.findOne({ auth: userId });
            if (!instructor) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor profile not found",
                });
            }
            assignmentData.instructor = instructor._id;
        }

        const assignment = new assignmentModel(assignmentData);
        await assignment.save();

        const populatedAssignment = await assignmentModel
            .findById(assignment._id)
            .populate("createdBy", "fullName email")
            .populate("attachedRubric", "title")
            .populate("subject", "name");

        return res.status(201).json({
            success: true,
            data: populatedAssignment,
            message: "Assignment created successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create assignment",
        });
    }
});

// Update assignment
exports.updateAssignment = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, deadline, attachedRubric, subject, attachments, status } = req.body;
        const userId = req.user._id;

        const assignment = await assignmentModel.findOne({ _id: id, isActive: true });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this assignment",
            });
        }

        // Validate deadline if provided
        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deadline date",
                });
            }
            assignment.deadline = deadlineDate;
        }

        // Validate rubric if provided
        if (attachedRubric) {
            const rubric = await rubricModel.findOne({ _id: attachedRubric, isActive: true });
            if (!rubric) {
                return res.status(404).json({
                    success: false,
                    message: "Attached rubric not found",
                });
            }
            assignment.attachedRubric = attachedRubric;
        }

        // Update fields
        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (subject) assignment.subject = subject;
        if (attachments) assignment.attachments = attachments;
        if (status) assignment.status = status;

        await assignment.save();

        const updatedAssignment = await assignmentModel
            .findById(assignment._id)
            .populate("createdBy", "fullName email")
            .populate("attachedRubric", "title")
            .populate("subject", "name");

        return res.status(200).json({
            success: true,
            data: updatedAssignment,
            message: "Assignment updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update assignment",
        });
    }
});

// Delete assignment (soft delete)
exports.deleteAssignment = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const assignment = await assignmentModel.findOne({ _id: id, isActive: true });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this assignment",
            });
        }

        // Soft delete
        assignment.isActive = false;
        await assignment.save();

        return res.status(200).json({
            success: true,
            message: "Assignment deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete assignment",
        });
    }
});

