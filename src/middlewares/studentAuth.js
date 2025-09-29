const jwt = require("jsonwebtoken");
const authModel = require("../models/auth");
const employeeModel = require("../models/employee");

const studentAuth = async (req, res, next) => {
    try {
        let token =
            req.body.authorization ||
            req.query.authorization ||
            req.headers["authorization"];

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "A token is required for authentication"
            });
        }

        try {
            token = token.split(" ")[1];
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            if (decoded.user.userType !== "Student") {
                return res.status(403).json({
                    success: false,
                    message: "Only students have access to this resource"
                });
            }

            // Find the auth user and populate the profile
            const authUser = await authModel.findById(decoded.user._id);
            if (!authUser) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid access token"
                });
            }

            // Find the student profile
            const student = await employeeModel.findById(authUser.profile);
            if (!student) {
                return res.status(403).json({
                    success: false,
                    message: "Student profile not found"
                });
            }

            // Set up req.user with the same structure as other controllers expect
            req.user = {
                _id: authUser._id,
                userType: authUser.userType,
                profile: student
            };

            next();
        } catch (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid token"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = studentAuth;
