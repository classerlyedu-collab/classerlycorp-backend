const jwt = require("jsonwebtoken");
const SubscriptionModel = require("../models/subscription");
const HRAdminModel = require("../models/hr-admin");

const tokengenerate = (user) => {
  return (token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET));
};

const verifytoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }

  return next();
};
const verifyadmintoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Admin") {
      return res.status(200).send({ message: "Only admin have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifyparenttoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Parent") {
      return res.status(200).send({ message: "Only parent have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifyteachertoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (
      decoded.user.userType !== "HR-Admin" &&
      decoded.user.userType !== "Admin"
    ) {
      return res.status(200).send({ message: "Only HR-Admin have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifystudenttoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Employee") {
      return res.status(200).send({ message: "Only Employee have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};

const verifysupervisortoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Supervisor") {
      return res.status(200).send({ message: "Only Supervisor have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};

// Middleware to verify HR-Admin subscription
const verifyHRAdminSubscription = async (req, res, next) => {
  try {
    // Only apply to HR-Admin users
    if (req.user.userType !== 'HR-Admin') {
      return next();
    }

    // Find HR-Admin profile
    const hrAdmin = await HRAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      return res.status(403).json({
        success: false,
        message: "HR-Admin profile not found"
      });
    }

    // Check subscription status
    const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdmin._id });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Subscription required to access this feature",
        requiresSubscription: true
      });
    }

    const isActive = subscription.status === 'active';
    const isGranted = subscription.accessGrantedBySuperAdmin === true;

    if (!isActive && !isGranted) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to access this feature",
        requiresSubscription: true
      });
    }

    // Add subscription info to request for use in controllers
    req.subscription = subscription;
    req.hrAdmin = hrAdmin;

    return next();
  } catch (error) {
    console.error('Subscription verification error:', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying subscription"
    });
  }
};

module.exports = {
  tokengenerate,
  verifytoken,
  verifyadmintoken,
  verifyparenttoken,
  verifyteachertoken,
  verifystudenttoken,
  verifysupervisortoken,
  verifyHRAdminSubscription,
};
