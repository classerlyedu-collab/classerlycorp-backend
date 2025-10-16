const { Router } = require("express");
const {
    getAllAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
} = require("../controllers/assignment.controller");
const { verifyteachertoken, verifytoken } = require("../middlewares/auth");

const router = Router();

// Read routes - accessible to HR-Admin, Instructor, and Employee
router.route("/").get(verifytoken, getAllAssignments);
router.route("/:id").get(verifytoken, getAssignmentById);

// Write routes - only for HR-Admin and Instructor
router.route("/").post(verifyteachertoken, createAssignment);
router.route("/:id").put(verifyteachertoken, updateAssignment);
router.route("/:id").delete(verifyteachertoken, deleteAssignment);

module.exports = router;

