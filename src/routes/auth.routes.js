const { Router } = require('express');
const { register, login, forgotpassword, verifyuser, resetpassword, updateuser, getmyprofile, changepassword } = require('../controllers/auth.controller');
const { stripeWebhook } = require('../controllers/subscription.controller');
const { getUserNotifications, markUserNotificationRead, markAllUserNotificationsRead } = require('../controllers/admincontrollers');
const { verifytoken } = require('../middlewares/auth');
const router = Router();
router.post("/register", register)
router.post("/login", login)
router.post("/forgotpassword", forgotpassword)
router.post("/changepassword", verifytoken, changepassword)

router.post("/verify", verifytoken, verifyuser)
router.post("/restepassword", verifytoken, resetpassword)
router.post("/updateuser", verifytoken, updateuser)
router.get("/profile", verifytoken, getmyprofile)
router.get("/notifications", verifytoken, getUserNotifications)
router.post("/notifications/read", verifytoken, markUserNotificationRead)
router.post("/notifications/read-all", verifytoken, markAllUserNotificationsRead)
// Stripe webhook (raw body parser required in app.js)
router.post("/stripe/webhook", stripeWebhook)

module.exports = router;