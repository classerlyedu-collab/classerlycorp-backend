const { Router } = require('express');

const {
    myemployees,
    addstudent,
    mydashboard,
    mycourses,
    mysubjects,
    getCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addComment,
    getComments,
    removeEmployee,
    getEmployeeRequests,
    cancelEmployeeRequest,
    deleteEmployeeRequest,
    updateEmployeeRequestSubjects,
    assignEmployeeSubjects,
    getEmployeeSubjectData,
    getEmployeeBySubject,
    addinstructor,
    removeInstructor,
    getMyInstructorRequests,
    updateInstructorRequest,
    instructorDashboard
} = require('../controllers/HRAdminController');
const { getnotification } = require('../controllers/supervisor.controllers');
const { verifytoken, verifyteachertoken, verifyHRAdminSubscription } = require('../middlewares/auth');
const { getMySubscription, createCheckoutSession, reportUsage } = require('../controllers/subscription.controller');

const router = Router();

// Feedback routes removed
router.route("/dashboard").get(verifytoken, verifyHRAdminSubscription, mydashboard);
// Instructor dashboard metrics (no subscription required)
router.route('/instructor/dashboard').get(verifytoken, instructorDashboard);
router.route('/getNotification').get(verifytoken, getnotification);
// Subscription (no subscription check needed)
router.route('/subscription').get(verifytoken, getMySubscription);
router.route('/subscription/checkout').post(verifytoken, createCheckoutSession);
router.route('/subscription/report-usage').post(verifytoken, reportUsage);
// Protected HR-Admin routes
router.route("/mycourses").get(verifyteachertoken, verifyHRAdminSubscription, mycourses);
router.route("/mysubjects").get(verifyteachertoken, verifyHRAdminSubscription, mysubjects);
router.route("/myemployees").get(verifyteachertoken, verifyHRAdminSubscription, myemployees);
router.route("/addstudent").post(verifyteachertoken, verifyHRAdminSubscription, addstudent);
router.route("/addemployee").post(verifyteachertoken, verifyHRAdminSubscription, addstudent);
// Instructor linking
router.route("/addinstructor").post(verifyteachertoken, verifyHRAdminSubscription, addinstructor);
router.route("/instructor/:instructorId").delete(verifyteachertoken, verifyHRAdminSubscription, removeInstructor);
router.route("/employee/:employeeId").delete(verifyteachertoken, verifyHRAdminSubscription, removeEmployee);

// Parent-Teacher Feedback Routes removed

// Calendar Events Routes
router.route("/calendar/events").get(verifytoken, verifyHRAdminSubscription, getCalendarEvents);
router.route("/calendar/events").post(verifytoken, verifyHRAdminSubscription, addCalendarEvent);
router.route("/calendar/events/:id").put(verifytoken, verifyHRAdminSubscription, updateCalendarEvent);
router.route("/calendar/events/:id").delete(verifytoken, verifyHRAdminSubscription, deleteCalendarEvent);

// Comment Routes
router.route("/comments").post(verifytoken, verifyHRAdminSubscription, addComment);
router.route("/comments/:recipientId").get(verifytoken, verifyHRAdminSubscription, getComments);

// Employee Requests Routes
router.route("/requests").get(verifytoken, verifyHRAdminSubscription, getEmployeeRequests);
router.route("/requests/:requestId/cancel").delete(verifytoken, verifyHRAdminSubscription, cancelEmployeeRequest);
router.route("/requests/:requestId/delete").delete(verifytoken, deleteEmployeeRequest);
router.route("/requests/:requestId/subjects").put(verifytoken, verifyHRAdminSubscription, updateEmployeeRequestSubjects);

// Direct Employee Subject Assignment Route
router.route("/employees/:employeeId/subjects").put(verifyteachertoken, verifyHRAdminSubscription, assignEmployeeSubjects);

// Employee Data Routes for HR-Admin
router.route("/employees/:employeeId/subjectdata").get(verifyteachertoken, verifyHRAdminSubscription, getEmployeeSubjectData);
router.route("/employees/:employeeId/bysubject").get(verifyteachertoken, verifyHRAdminSubscription, getEmployeeBySubject);

// Instructor self-service endpoints (accessed by Instructor role)
router.route("/instructor/requests").get(verifytoken, getMyInstructorRequests);
router.route("/instructor/requests/:id").put(verifytoken, updateInstructorRequest);

module.exports = router;