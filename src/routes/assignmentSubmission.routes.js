const { Router } = require("express");
const {
    submitAssignment,
    getMySubmissions,
    getAssignmentSubmissions,
    gradeSubmission,
    getSubmissionStatus,
} = require("../controllers/assignmentSubmission.controller");
const { verifytoken, verifyteachertoken } = require("../middlewares/auth");

const router = Router();

// Employee routes
router.route("/submit").post(verifytoken, submitAssignment);
router.route("/my-submissions").get(verifytoken, getMySubmissions);
router.route("/status/:assignmentId").get(verifytoken, getSubmissionStatus);

// HR-Admin/Instructor routes
router.route("/assignment/:assignmentId").get(verifyteachertoken, getAssignmentSubmissions);
router.route("/:submissionId/grade").put(verifyteachertoken, gradeSubmission);

module.exports = router;

