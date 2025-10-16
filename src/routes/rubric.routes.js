const { Router } = require("express");
const {
    getAllRubrics,
    getRubricById,
    createRubric,
    updateRubric,
    deleteRubric,
} = require("../controllers/rubric.controller");
const { verifyteachertoken, verifytoken } = require("../middlewares/auth");

const router = Router();

// Read routes - accessible to HR-Admin, Instructor, and Employee
router.route("/").get(verifytoken, getAllRubrics);
router.route("/:id").get(verifytoken, getRubricById);

// Write routes - only for HR-Admin and Instructor
router.route("/").post(verifyteachertoken, createRubric);
router.route("/:id").put(verifyteachertoken, updateRubric);
router.route("/:id").delete(verifyteachertoken, deleteRubric);

module.exports = router;

