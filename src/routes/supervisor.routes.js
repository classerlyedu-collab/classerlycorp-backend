const { Router } = require('express');
const { addNewChild, getMyChilds,
    getMyChildbysubjectId,
    getnotification, markAllNotificationsAsRead, getQuizInfo, getMyChildbyId, getMyChildsubjectdata,
    getSupervisorStats, getSupervisorRecentActivity, getSupervisorTeamOverview, testLessonCompletion, debugEmployeeData, setLessonProgress } = require("../controllers/supervisor.controllers");
const { verifytoken, verifyparenttoken, verifysupervisortoken } = require('../middlewares/auth');

const router = Router();

// ###################### Supervisor Routes #########################
// router.route('/registerParent').post(registerparent);
router.route('/addchild').post(verifysupervisortoken, addNewChild);
router.route('/getNotification').get(verifytoken, getnotification);
router.route('/markAllNotificationsAsRead').post(verifytoken, markAllNotificationsAsRead);

router.route('/getMyChildsubjectdata/:id').get(verifysupervisortoken, getMyChildsubjectdata);

// Parent feedback routes removed

router.route('/mychilds').get(verifysupervisortoken, getMyChilds);

router.route('/mychild/:id').get(verifysupervisortoken, getMyChildbyId);
router.route('/mychildbysubject/:id').get(verifysupervisortoken, getMyChildbysubjectId);

router.route("/getquizinfo/:id").get(verifysupervisortoken, getQuizInfo);

// New dashboard endpoints
router.route('/mystats').get(verifysupervisortoken, getSupervisorStats);
router.route('/recentactivity').get(verifysupervisortoken, getSupervisorRecentActivity);
router.route('/mychildren').get(verifysupervisortoken, getSupervisorTeamOverview);

// Test endpoint for lesson completion
router.route('/test-lesson-completion/:employeeId/:lessonId').post(verifysupervisortoken, testLessonCompletion);

// Debug endpoint to check employee data structure
router.route('/debug-employee-data').get(verifysupervisortoken, debugEmployeeData);

// Test endpoint to set lesson progress
router.route('/set-lesson-progress/:lessonId').post(verifysupervisortoken, setLessonProgress);

module.exports = router;