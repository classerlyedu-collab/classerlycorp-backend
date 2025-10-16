const assignmentSubmissionModel = require("../models/assignmentSubmission");
const assignmentModel = require("../models/assignment");
const employeeModel = require("../models/employee");
const hrAdminModel = require("../models/hr-admin");
const InstructorModel = require("../models/instructor");
const asyncHandler = require("../utils/asyncHandler");
const cloud = require("../config/cloudnaryconfig");

// Employee: Submit assignment
exports.submitAssignment = asyncHandler(async (req, res) => {
    try {
        const { assignmentId, fileUrl, fileName, fileMetadata } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        if (userType !== "Employee") {
            return res.status(403).json({
                success: false,
                message: "Only employees can submit assignments",
            });
        }

        // Validation
        if (!assignmentId || !fileUrl || !fileName) {
            return res.status(400).json({
                success: false,
                message: "Assignment ID, file URL, and file name are required",
            });
        }

        // Get employee profile
        const employee = await employeeModel.findOne({ auth: userId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found",
            });
        }

        // Get assignment and verify it's published
        const assignment = await assignmentModel.findOne({
            _id: assignmentId,
            isActive: true,
            status: "published",
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or not available for submission",
            });
        }

        // Check if deadline has passed
        if (new Date() > new Date(assignment.deadline)) {
            return res.status(400).json({
                success: false,
                message: "Submission deadline has passed",
            });
        }

        // Check if already submitted
        const existingSubmission = await assignmentSubmissionModel.findOne({
            assignment: assignmentId,
            employee: employee._id,
        });

        if (existingSubmission) {
            // Delete old file from Cloudinary if it exists
            if (existingSubmission.fileMetadata && existingSubmission.fileMetadata.publicId) {
                try {
                    const resourceType = existingSubmission.fileMetadata.resourceType || 'raw';
                    await cloud.uploader.destroy(existingSubmission.fileMetadata.publicId, {
                        resource_type: resourceType
                    });
                } catch (error) {
                    console.error("Error deleting old file from Cloudinary:", error.message);
                    // Continue with submission even if deletion fails
                }
            }

            // Update existing submission with new file
            existingSubmission.fileUrl = fileUrl;
            existingSubmission.fileName = fileName;
            existingSubmission.fileMetadata = fileMetadata;
            existingSubmission.submittedAt = new Date();
            existingSubmission.status = "submitted";
            existingSubmission.grade = undefined; // Clear previous grade
            await existingSubmission.save();

            return res.status(200).json({
                success: true,
                data: existingSubmission,
                message: "Assignment resubmitted successfully",
            });
        }

        // Create new submission
        const submission = new assignmentSubmissionModel({
            assignment: assignmentId,
            employee: employee._id,
            submittedBy: userId,
            fileUrl,
            fileName,
            fileMetadata,
        });

        await submission.save();

        const populatedSubmission = await assignmentSubmissionModel
            .findById(submission._id)
            .populate("assignment", "title deadline")
            .populate("submittedBy", "fullName email");

        return res.status(201).json({
            success: true,
            data: populatedSubmission,
            message: "Assignment submitted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit assignment",
        });
    }
});

// Employee: Get my submissions
exports.getMySubmissions = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.userType;

        if (userType !== "Employee") {
            return res.status(403).json({
                success: false,
                message: "Only employees can view submissions",
            });
        }

        const employee = await employeeModel.findOne({ auth: userId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found",
            });
        }

        const submissions = await assignmentSubmissionModel
            .find({ employee: employee._id })
            .populate("assignment", "title deadline attachedRubric subject")
            .populate({
                path: "assignment",
                populate: [
                    { path: "attachedRubric", select: "title criteria" },
                    { path: "subject", select: "name" },
                ],
            })
            .populate("submittedBy", "fullName email")
            .populate("grade.gradedBy", "fullName email")
            .sort({ submittedAt: -1 });

        return res.status(200).json({
            success: true,
            data: submissions,
            message: "Submissions retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve submissions",
        });
    }
});

// HR-Admin/Instructor: Get all submissions for an assignment
exports.getAssignmentSubmissions = asyncHandler(async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user._id;
        const userType = req.user.userType;

        // Verify assignment belongs to this user
        const assignment = await assignmentModel.findOne({
            _id: assignmentId,
            isActive: true,
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        // Verify access
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId }).populate("instructors");
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }

            // HR-Admin can access submissions for assignments created by themselves OR their linked instructors
            const instructorIds = (hrAdmin.instructors || []).map(inst => inst._id.toString());
            const isOwnAssignment = assignment.hrAdmin?.toString() === hrAdmin._id.toString();
            const isInstructorAssignment = assignment.instructor && instructorIds.includes(assignment.instructor.toString());

            if (!isOwnAssignment && !isInstructorAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to view these submissions",
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

            // Instructor can access submissions for assignments created by themselves OR their linked HR-Admins
            const hrAdminIds = (instructor.hrAdmins || []).map(hr => hr._id.toString());
            const isOwnAssignment = assignment.instructor?.toString() === instructor._id.toString();
            const isHrAdminAssignment = assignment.hrAdmin && hrAdminIds.includes(assignment.hrAdmin.toString());

            if (!isOwnAssignment && !isHrAdminAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to view these submissions",
                });
            }
        }

        const submissions = await assignmentSubmissionModel
            .find({ assignment: assignmentId })
            .populate("employee", "auth")
            .populate({
                path: "employee",
                populate: { path: "auth", select: "fullName email image" },
            })
            .populate("submittedBy", "fullName email")
            .populate("grade.gradedBy", "fullName email")
            .sort({ submittedAt: -1 });

        return res.status(200).json({
            success: true,
            data: submissions,
            message: "Submissions retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve submissions",
        });
    }
});

// HR-Admin/Instructor: Grade a submission
exports.gradeSubmission = asyncHandler(async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score, maxScore, feedback } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        if (userType !== "HR-Admin" && userType !== "Instructor") {
            return res.status(403).json({
                success: false,
                message: "Only HR-Admin or Instructor can grade submissions",
            });
        }

        // Validation
        if (score === undefined || maxScore === undefined) {
            return res.status(400).json({
                success: false,
                message: "Score and max score are required",
            });
        }

        if (score < 0 || score > maxScore) {
            return res.status(400).json({
                success: false,
                message: "Score must be between 0 and max score",
            });
        }

        const submission = await assignmentSubmissionModel
            .findById(submissionId)
            .populate("assignment");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        // Verify access
        const assignment = submission.assignment;
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId }).populate("instructors");
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }

            // HR-Admin can grade submissions for assignments created by themselves OR their linked instructors
            const instructorIds = (hrAdmin.instructors || []).map(inst => inst._id.toString());
            const isOwnAssignment = assignment.hrAdmin?.toString() === hrAdmin._id.toString();
            const isInstructorAssignment = assignment.instructor && instructorIds.includes(assignment.instructor.toString());

            if (!isOwnAssignment && !isInstructorAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to grade this submission",
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

            // Instructor can grade submissions for assignments created by themselves OR their linked HR-Admins
            const hrAdminIds = (instructor.hrAdmins || []).map(hr => hr._id.toString());
            const isOwnAssignment = assignment.instructor?.toString() === instructor._id.toString();
            const isHrAdminAssignment = assignment.hrAdmin && hrAdminIds.includes(assignment.hrAdmin.toString());

            if (!isOwnAssignment && !isHrAdminAssignment) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to grade this submission",
                });
            }
        }

        // Update grade
        submission.grade = {
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            feedback: feedback || "",
            gradedBy: userId,
            gradedAt: new Date(),
        };
        submission.status = "graded";

        await submission.save();

        const updatedSubmission = await assignmentSubmissionModel
            .findById(submission._id)
            .populate("assignment", "title")
            .populate("employee", "auth")
            .populate({
                path: "employee",
                populate: { path: "auth", select: "fullName email" },
            })
            .populate("grade.gradedBy", "fullName email");

        return res.status(200).json({
            success: true,
            data: updatedSubmission,
            message: "Submission graded successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to grade submission",
        });
    }
});

// Get submission status for an assignment (for employee)
exports.getSubmissionStatus = asyncHandler(async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user._id;
        const userType = req.user.userType;

        if (userType !== "Employee") {
            return res.status(403).json({
                success: false,
                message: "Only employees can check submission status",
            });
        }

        const employee = await employeeModel.findOne({ auth: userId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found",
            });
        }

        const submission = await assignmentSubmissionModel
            .findOne({ assignment: assignmentId, employee: employee._id })
            .populate("submittedBy", "fullName email")
            .populate("grade.gradedBy", "fullName email");

        return res.status(200).json({
            success: true,
            data: submission,
            message: submission ? "Submission found" : "No submission yet",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get submission status",
        });
    }
});

