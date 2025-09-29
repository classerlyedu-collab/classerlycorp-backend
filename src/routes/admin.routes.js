const { Router } = require("express");

const {
    AdminAddEvent,
    getAllTeachers,
    getTeacherById,
    getAllStudents,
    getStudentById,
    getAllParents,
    getParentById,
    updateUserByAdmin,
    blockUserById,
    unblockUserById,
    getAllQuizzess,
    getQuizById,
    getAllSubjects,
    getTopicsBySubjectId,
    getLessonsByTopicId,
    getAnalyticsForAdmin,
    getMonthlyStudentRegistrations,
    getLessonById,
    editSubject,
    deleteSubject,
    addTopic,
    editTopic,
    deleteTopic,
    addLesson,
    editLesson,
    deleteLesson,
    getActiveUsers,
    getAllCustomerSubscriptions,
    getQuizPassFailAverages,
    getQuizPassFailAveragesOverall,
    getQuizPassFailAveragesByGradeSubject,
    getAllCoupons,
    getQuizPassFailMatrix,
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    getUsersForNotification
} = require("../controllers/admincontrollers");
const { toggleSubscriptionAccess, getHRAdminSubscriptionStatus } = require("../controllers/subscriptionAccess");
const { verifyadmintoken } = require("../middlewares/auth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/upload.controller');

// basic multer setup to accept single file under key 'file'
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadsDir); },
    filename: function (req, file, cb) {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + sanitized);
    }
});
const imageUpload = multer({ storage });

const router = Router();

// Event route
router.route("/event").post(verifyadmintoken, AdminAddEvent);
// analytics
router.route("/analytics").get(verifyadmintoken, getAnalyticsForAdmin);
// quiz pass/fail averages (overall and by subject)
router.route("/quiz-stats").get(verifyadmintoken, getQuizPassFailAveragesOverall);
router.route("/quiz-stats/:subjectId").get(verifyadmintoken, getQuizPassFailAverages);
// Teachers routes
router.route("/teachers").get(verifyadmintoken, getAllTeachers);
router.route("/teacher/:id").get(verifyadmintoken, getTeacherById);
// Students routes
router.route("/students").get(verifyadmintoken, getAllStudents);
router.route("/student/:id").get(verifyadmintoken, getStudentById);
router.route("/studentRegistrationCount").get(verifyadmintoken, getMonthlyStudentRegistrations);
// Parents routes
router.route("/parents").get(verifyadmintoken, getAllParents);
router.route("/parent/:id").get(verifyadmintoken, getParentById);
// update user
router.put("/updateuser", verifyadmintoken, updateUserByAdmin);
// block user by id
router.put("/block", verifyadmintoken, blockUserById);
router.put("/unblock", verifyadmintoken, unblockUserById);
// quizzess
router.get("/quizzes", verifyadmintoken, getAllQuizzess);
router.get("/quiz/:id", verifyadmintoken, getQuizById);
// subjects
router.get("/subjects", verifyadmintoken, getAllSubjects);
// Support optional image upload via backend (form-data: file, plus body fields)
router.put("/editSubject", verifyadmintoken, imageUpload.single('file'), async (req, res, next) => {
    try {
        // If a file is included, first upload to cloudinary to get URL
        if (req.file) {
            // Reuse upload controller logic
            const cloud = require('../config/cloudnaryconfig');
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            const result = await cloud.uploader.upload(filePath, { resource_type: 'image', folder: 'Classify Enterprises/subjects' });
            // Inject URL into body.image for editSubject to use
            req.body.image = result.secure_url;
            // cleanup local file
            fs.unlink(filePath, () => { });
        }
        return editSubject(req, res, next);
    } catch (e) {
        return res.status(500).json({ success: false, message: e?.message || 'Upload failed' });
    }
});
router.delete("/deleteSubject/:id", verifyadmintoken, deleteSubject);
// topics
router.get("/topics/:id", verifyadmintoken, getTopicsBySubjectId);
router.post("/addTopic", verifyadmintoken, addTopic);
router.put("/editTopic", verifyadmintoken, editTopic);
router.put("/deleteTopic", verifyadmintoken, deleteTopic);
// lessons
router.get("/lessons/:id", verifyadmintoken, getLessonsByTopicId);
router.get("/lessons/lessonId/:id", verifyadmintoken, getLessonById);
router.post("/addLesson", verifyadmintoken, addLesson);
router.put("/editLesson", verifyadmintoken, editLesson);
router.put("/deleteLesson", verifyadmintoken, deleteLesson);
router.get("/activeusers", verifyadmintoken, getActiveUsers);
router.get("/stripedata", verifyadmintoken, getAllCustomerSubscriptions);
router.get("/coupons", verifyadmintoken, getAllCoupons);

// ==================== NOTIFICATION ROUTES ====================
// Notifications
router.post("/notifications", verifyadmintoken, createNotification);
router.get("/notifications", verifyadmintoken, getAllNotifications);
router.get("/notifications/:id", verifyadmintoken, getNotificationById);
router.put("/notifications/:id", verifyadmintoken, updateNotification);
router.delete("/notifications/:id", verifyadmintoken, deleteNotification);
router.get("/users-for-notification", verifyadmintoken, getUsersForNotification);







// Subscription access control routes
router.route("/hr-admin/:hrAdminId/subscription-status").get(verifyadmintoken, getHRAdminSubscriptionStatus);
router.route("/hr-admin/toggle-subscription-access").post(verifyadmintoken, toggleSubscriptionAccess);

module.exports = router;