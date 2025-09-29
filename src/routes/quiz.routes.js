const { Router } = require("express");

const {
  addquiz,
  updatestatusquiz,
  addananswer,
  getquizes,
  updatequiz,
  deletequiz,
  addquestion,
  updatequestion,
  deletequestions,
  getstudentquizesbyquizid,
  updatestudentquize,
  getMyQuizesByResult
} = require("../controllers/quiz.contrroller.js");
const { verifytoken, verifyteachertoken, verifystudenttoken, verifyHRAdminSubscription } = require("../middlewares/auth");

const router = Router();
//teacher (HR-Admin routes - require subscription)
router.route("/teacher").post(verifyteachertoken, verifyHRAdminSubscription, addquiz);
router.route("/teacher/:id").put(verifyteachertoken, verifyHRAdminSubscription, updatequiz);
router.route("/teacher/:id").delete(verifyteachertoken, verifyHRAdminSubscription, deletequiz);
router.route("/teacher/student/:id").get(verifyteachertoken, verifyHRAdminSubscription, getstudentquizesbyquizid);
router.route("/teacher/s/:id").put(verifytoken, verifyHRAdminSubscription, updatestudentquize);

//question (HR-Admin routes - require subscription)
router.route("/teacher/q").post(verifyteachertoken, verifyHRAdminSubscription, addquestion);
router.route("/teacher/q/:id").put(verifyteachertoken, verifyHRAdminSubscription, updatequestion);
router.route("/teacher/q/:id").delete(verifyteachertoken, verifyHRAdminSubscription, deletequestions);

//student
router.route("/student/:id").post(verifystudenttoken, updatestatusquiz);
router.route("/student/myquiz").get(verifystudenttoken, getMyQuizesByResult);

//employee
router.route("/employee/myquiz").get(verifystudenttoken, getMyQuizesByResult);
router.route("/employee/:id").post(verifystudenttoken, updatestatusquiz);

router.route("/student/a/:id").post(verifytoken, addananswer);
router.route("/").get(verifytoken, getquizes);




module.exports = router;