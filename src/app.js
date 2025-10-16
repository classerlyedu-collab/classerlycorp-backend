const express = require("express");
const app = express();
const cors = require("cors");
const cookieparser = require("cookie-parser");
const path = require("path");
const commentRoutes = require("./routes/comment");
const lessonDiscussionRoutes = require("./routes/lessonDiscussion.routes");

// 🚨 Apply raw body parser ONLY for Stripe Webhooks FIRST
app.use("/api/v1/auth/stripe/webhook", express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "50mb" }));

app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);



//routes

app.get("", (req, res) => {
  res.send("Welcome to Corporate Learning Platform")
})

const subjectRoutes = require("./routes/subject.routes");
const supervisorRoutes = require("./routes/supervisor.routes");
const hrAdminRoutes = require("./routes/hr-admin.routes");
const adminRoutes = require("./routes/admin.routes");

const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");
const topicRoutes = require("./routes/topic.routes");

const quizRoutes = require("./routes/quiz.routes")
const employeeRoutes = require("./routes/employee.routes")
const rubricRoutes = require("./routes/rubric.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const assignmentSubmissionRoutes = require("./routes/assignmentSubmission.routes");
// const adddata = require("./utils/adddummydata");
const bodyParser = require("body-parser");

//declare
// adddata();

// Middleware for other routes

// app.use(
//   bodyParser.json({
//       verify: function(req, res, buf) {
//           req.rawBody = buf;
//       }
//   })
// );


// app.use(express.json({
//   verify: (req, res, buf) => {
//     if (req.originalUrl.startsWith('/api/v1/webhook')) {
//       req.rawBody = buf.toString();
//     }
//   },
//    }));


// app.use(bodyParser.json())
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/employee", employeeRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", uploadRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/topic", topicRoutes);
app.use("/api/v1/supervisor", supervisorRoutes);

app.use("/api/comments", commentRoutes);
app.use("/api/v1/discussions", lessonDiscussionRoutes);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: process.env.UPLOAD_CACHE_MAX_AGE || 3600000, // Set cache expiry for 1 hour (optional)
  })
);


// app.use('/api/v1/curriculum',curriculumRoutes);
app.use("/api/v1/hr-admin", hrAdminRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/rubric", rubricRoutes);
app.use("/api/v1/assignment", assignmentRoutes);
app.use("/api/v1/submission", assignmentSubmissionRoutes);



app.use("/api/v1/admin", adminRoutes);
module.exports = app;
