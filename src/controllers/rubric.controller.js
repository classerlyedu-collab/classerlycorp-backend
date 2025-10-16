const rubricModel = require("../models/rubric");
const hrAdminModel = require("../models/hr-admin");
const InstructorModel = require("../models/instructor");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// Get all rubrics for the current user
exports.getAllRubrics = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.userType;

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

            // Get rubrics created by this HR-Admin OR any of their instructors
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

            // Get rubrics created by this Instructor OR any of their linked HR-Admins
            const hrAdminIds = instructor.hrAdmins.map(hr => hr._id);
            query.$or = [
                { instructor: instructor._id },
                { hrAdmin: { $in: hrAdminIds } }
            ];
        } else if (userType === "Employee") {
            // Employees can view rubrics from their HR-Admin and linked instructors
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
                    message: "No rubrics available. You are not linked to any HR-Admin.",
                });
            }

            // Get rubrics from HR-Admin and their instructors
            const instructorIds = (hrAdmin.instructors || []).map(inst => inst._id);
            query.$or = [
                { hrAdmin: hrAdmin._id },
                { instructor: { $in: instructorIds } }
            ];
        }

        const rubrics = await rubricModel
            .find(query)
            .populate("createdBy", "fullName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: rubrics,
            message: "Rubrics retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve rubrics",
        });
    }
});

// Get single rubric by ID
exports.getRubricById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userType = req.user.userType;

        const rubric = await rubricModel
            .findOne({ _id: id, isActive: true })
            .populate("createdBy", "fullName email");

        if (!rubric) {
            return res.status(404).json({
                success: false,
                message: "Rubric not found",
            });
        }

        // Verify access rights
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId });
            if (!hrAdmin || rubric.hrAdmin?.toString() !== hrAdmin._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to access this rubric",
                });
            }
        } else if (userType === "Instructor") {
            const instructor = await InstructorModel.findOne({ auth: userId });
            if (!instructor || rubric.instructor?.toString() !== instructor._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to access this rubric",
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: rubric,
            message: "Rubric retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve rubric",
        });
    }
});

// Create new rubric
exports.createRubric = asyncHandler(async (req, res) => {
    try {
        const { title, description, criteria } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        // Validation
        if (!title || !description || !criteria || criteria.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and at least one criterion are required",
            });
        }

        // Validate criteria
        for (const criterion of criteria) {
            if (!criterion.criterion || criterion.weight === undefined || criterion.maxScore === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Each criterion must have name, weight, and maxScore",
                });
            }
            if (criterion.weight < 0 || criterion.weight > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Weight must be between 0 and 100",
                });
            }
            if (criterion.maxScore <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum score must be greater than 0",
                });
            }
        }

        // Prepare rubric data
        const rubricData = {
            title,
            description,
            criteria,
            createdBy: userId,
        };

        // Set hrAdmin or instructor based on user type
        if (userType === "HR-Admin") {
            const hrAdmin = await hrAdminModel.findOne({ auth: userId });
            if (!hrAdmin) {
                return res.status(404).json({
                    success: false,
                    message: "HR-Admin profile not found",
                });
            }
            rubricData.hrAdmin = hrAdmin._id;
        } else if (userType === "Instructor") {
            const instructor = await InstructorModel.findOne({ auth: userId });
            if (!instructor) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor profile not found",
                });
            }
            rubricData.instructor = instructor._id;
        }

        const rubric = new rubricModel(rubricData);
        await rubric.save();

        const populatedRubric = await rubricModel
            .findById(rubric._id)
            .populate("createdBy", "fullName email");

        return res.status(201).json({
            success: true,
            data: populatedRubric,
            message: "Rubric created successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create rubric",
        });
    }
});

// Update rubric
exports.updateRubric = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, criteria } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        const rubric = await rubricModel.findOne({ _id: id, isActive: true });

        if (!rubric) {
            return res.status(404).json({
                success: false,
                message: "Rubric not found",
            });
        }

        // Verify ownership
        if (rubric.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this rubric",
            });
        }

        // Validate criteria if provided
        if (criteria && criteria.length > 0) {
            for (const criterion of criteria) {
                if (!criterion.criterion || criterion.weight === undefined || criterion.maxScore === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "Each criterion must have name, weight, and maxScore",
                    });
                }
                if (criterion.weight < 0 || criterion.weight > 100) {
                    return res.status(400).json({
                        success: false,
                        message: "Weight must be between 0 and 100",
                    });
                }
                if (criterion.maxScore <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum score must be greater than 0",
                    });
                }
            }
        }

        // Update fields
        if (title) rubric.title = title;
        if (description) rubric.description = description;
        if (criteria && criteria.length > 0) rubric.criteria = criteria;

        await rubric.save();

        const updatedRubric = await rubricModel
            .findById(rubric._id)
            .populate("createdBy", "fullName email");

        return res.status(200).json({
            success: true,
            data: updatedRubric,
            message: "Rubric updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update rubric",
        });
    }
});

// Delete rubric (soft delete)
exports.deleteRubric = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const rubric = await rubricModel.findOne({ _id: id, isActive: true });

        if (!rubric) {
            return res.status(404).json({
                success: false,
                message: "Rubric not found",
            });
        }

        // Verify ownership
        if (rubric.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this rubric",
            });
        }

        // Soft delete
        rubric.isActive = false;
        await rubric.save();

        return res.status(200).json({
            success: true,
            message: "Rubric deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete rubric",
        });
    }
});

