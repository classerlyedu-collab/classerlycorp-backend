const { Router } = require("express");
const { verifystudenttoken } = require("../middlewares/auth");
const { getmyrequests, updaterequest, deleterequest, myteachers, getmyteacher, myresult, mysubjects, getEmployeeStats, getTopPerformers, getClassProgress } = require("../controllers/employeeController");
const { getnotification } = require('../controllers/supervisor.controllers');

const router = Router();
router.route("/myrequests").get(verifystudenttoken, getmyrequests);
router.route("/myteachers").get(verifystudenttoken, getmyteacher);
router.route("/myresult").get(verifystudenttoken, myresult);
router.route("/mysubjects").get(verifystudenttoken, mysubjects);
router.route("/mystats").get(verifystudenttoken, getEmployeeStats);
router.route("/topperformers").get(verifystudenttoken, getTopPerformers);
router.route("/classprogress").get(verifystudenttoken, getClassProgress);
// router.route("/myteachers").get(verifystudenttoken,myteachers);

router.route("/request/:id").put(verifystudenttoken, updaterequest);
router.route("/request/:id").delete(verifystudenttoken, deleterequest);
// Feedback routes removed
router.route('/getNotification').get(verifystudenttoken, getnotification);

module.exports = router;