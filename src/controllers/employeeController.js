const employeeModel = require("../models/employee");
// const EmployeeGamesModel = require("../models/employeegames.model"); // Removed - games no longer needed
const EmployeeQuizesModel = require("../models/employeequizes");
const hrAdminModel = require("../models/hr-admin");
const hrAdminEmployeeRequestModel = require("../models/hradminemployeerequest");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
exports.mysubjects = async (req, res) => {
  try {
    const employeeId = req.user?.profile?._id;

    // First check if employee is linked to any HR-Admin
    const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
    if (!hrAdmin) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No subjects available. You are not linked to any HR-Admin."
      });
    }

    let data = await employeeModel
      .findOne({ _id: employeeId })
      .populate({ path: "subjects", select: ["name", "image"] });

    return res.send({
      success: true,
      data: data?.subjects || [],
      message: "subjects get Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

// exports.myteachers = async (req, res) => {
//   try {
//     let data = await teacherModel.find(
//       { students: { $in: [req.user?.profile?._id] } },
//       { auth: 1 ,feedback:0,grade:0,students:0,subjects:0}
//     );

//     return res.send({
//       success: true,
//       data,
//       message: "teachersget Successfully",
//     });
//   } catch (error) {
//     return res.status(200).json({ success: false, message: error.message });
//   }
// };
exports.getmyrequests = async (req, res) => {
  try {
    let data = await hrAdminEmployeeRequestModel
      .find({
        employee: req.user?.profile?._id,
        $or: [
          { status: "Pending" },
          { status: "Rejected" },
          { status: "Complete" }
        ]
      })
      .populate({
        path: "hrAdmin",
        select: "auth",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "image", "fullAddress"],
        },
      })
      .populate({
        path: "instructor",
        select: "auth code",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "image", "fullAddress"],
        },
      });

    return res.send({
      success: true,
      data,
      message: "requests get Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

exports.updaterequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status != "Complete" && status != "Rejected") {
      return res.send({
        success: false,
        message: "Invalid Status",
      });
    }
    const data = await hrAdminEmployeeRequestModel.findById(id);
    if (!data) {
      return res.send({
        success: false,
        message: "Invalid Request",
      });
    }
    await hrAdminEmployeeRequestModel.findOneAndUpdate({ _id: id }, { status });
    if (status == "Complete") {
      // Get subjects from the request to assign to employee
      const requestSubjects = data.subjects || [];

      // Add employee to HR-Admin's employees array
      await hrAdminModel.findOneAndUpdate(
        { _id: data.hrAdmin },
        { $addToSet: { employees: req.user?.profile?._id } }
      );

      // Update employee record to only add these subjects (preserve existing subjects)
      await employeeModel.findOneAndUpdate(
        { auth: req.user._id },
        { $addToSet: { subjects: { $each: requestSubjects } } }
      );

      // Report usage to Stripe for metered billing
      try {
        const SubscriptionModel = require('../models/subscription');
        const subscription = await SubscriptionModel.findOne({ hrAdmin: data.hrAdmin });

        if (subscription && subscription.stripeSubscriptionId && subscription.stripeSubscriptionItemId) {
          const hrAdmin = await hrAdminModel.findById(data.hrAdmin).populate('employees');
          const seatCount = hrAdmin.employees?.length || 0;

          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          await stripe.subscriptionItems.createUsageRecord(
            subscription.stripeSubscriptionItemId,
            {
              quantity: seatCount,
              timestamp: Math.floor(Date.now() / 1000),
              action: 'set'
            }
          );

          // Update local subscription record
          await SubscriptionModel.findOneAndUpdate(
            { hrAdmin: data.hrAdmin },
            { seatCount, lastUsageReported: new Date() }
          );

          console.log(`Usage reported for HR-Admin ${data.hrAdmin}: ${seatCount} employees`);
        }
      } catch (error) {
        console.error('Error reporting usage to Stripe:', error.message);
        // Don't fail the main operation if usage reporting fails
      }
    }

    return res.send({
      success: true,
      message: "Request updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

exports.getmyteacher = async (req, res) => {
  try {
    // HR-Admins who manage this employee
    const hrAdmins = await hrAdminModel
      .find({ employees: { $in: req.user.profile._id } }, { auth: 1 })
      .populate({ path: "auth", select: "-password" });

    // Instructors linked via accepted requests for this employee
    const instructorRequests = await hrAdminEmployeeRequestModel
      .find({
        employee: req.user.profile._id,
        status: "Complete",
        instructor: { $exists: true, $ne: null }
      })
      .populate({ path: 'instructor', select: 'auth', populate: { path: 'auth', select: '-password' } });

    const instructors = [];
    const seenInstructorIds = new Set();
    for (const reqDoc of instructorRequests) {
      const ins = reqDoc.instructor;
      if (ins && ins._id && !seenInstructorIds.has(String(ins._id))) {
        seenInstructorIds.add(String(ins._id));
        instructors.push(ins);
      }
    }

    // Combine and return unified list
    const team = [...hrAdmins, ...instructors];

    return res.send({
      success: true,
      data: team,
      message: "Team members get successfully",
    });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};
exports.myresult = async (req, res) => {
  try {
    const employeeId = req.user?.profile?._id;

    // Get quiz data
    let quizData = await EmployeeQuizesModel.find({
      employee: employeeId,
    }).populate({
      path: 'quiz',
      select: 'subject topic lesson createdAt',
      populate: [
        { path: 'subject', select: 'name image' },
        { path: 'topic', select: 'name' },
        { path: 'lesson', select: 'name' }
      ]
    });

    // Get employee subjects
    const employee = await employeeModel
      .findById(employeeId)
      .populate({ path: "subjects", select: ["name", "image"] });

    // Calculate detailed statistics
    const totalQuizzes = quizData.length;
    const passedQuizzes = quizData.filter(q => q.result === "pass").length;
    const failedQuizzes = quizData.filter(q => q.result === "fail").length;
    const successRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

    // Calculate subject-wise performance
    const subjectPerformance = {};
    quizData.forEach(quiz => {
      if (quiz.quiz && quiz.quiz.subject) {
        const subjectId = quiz.quiz.subject._id;
        const subjectName = quiz.quiz.subject.name;

        if (!subjectPerformance[subjectId]) {
          subjectPerformance[subjectId] = {
            name: subjectName,
            image: quiz.quiz.subject.image,
            total: 0,
            passed: 0,
            failed: 0,
            successRate: 0
          };
        }

        subjectPerformance[subjectId].total++;
        if (quiz.result === "pass") {
          subjectPerformance[subjectId].passed++;
        } else {
          subjectPerformance[subjectId].failed++;
        }
      }
    });

    // Calculate success rates for each subject
    Object.keys(subjectPerformance).forEach(subjectId => {
      const subject = subjectPerformance[subjectId];
      subject.successRate = subject.total > 0 ? Math.round((subject.passed / subject.total) * 100) : 0;
    });

    // Calculate recent performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentQuizzes = quizData.filter(quiz =>
      quiz.createdAt && new Date(quiz.createdAt) >= thirtyDaysAgo
    );

    const recentPassed = recentQuizzes.filter(q => q.result === "pass").length;
    const recentTotal = recentQuizzes.length;
    const recentSuccessRate = recentTotal > 0 ? Math.round((recentPassed / recentTotal) * 100) : 0;

    // Calculate monthly performance trend (last 6 months)
    const monthlyTrend = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    quizData.forEach(quiz => {
      if (quiz.createdAt && new Date(quiz.createdAt) >= sixMonthsAgo) {
        const monthKey = new Date(quiz.createdAt).toISOString().substring(0, 7); // YYYY-MM format

        if (!monthlyTrend[monthKey]) {
          monthlyTrend[monthKey] = { total: 0, passed: 0, failed: 0 };
        }

        monthlyTrend[monthKey].total++;
        if (quiz.result === "pass") {
          monthlyTrend[monthKey].passed++;
        } else {
          monthlyTrend[monthKey].failed++;
        }
      }
    });

    // Convert monthly trend to array with success rates
    const monthlyTrendArray = Object.keys(monthlyTrend)
      .sort()
      .map(month => ({
        month,
        ...monthlyTrend[month],
        successRate: monthlyTrend[month].total > 0
          ? Math.round((monthlyTrend[month].passed / monthlyTrend[month].total) * 100)
          : 0
      }));

    // Calculate performance insights
    const insights = {
      overallPerformance: successRate >= 80 ? "excellent" : successRate >= 60 ? "good" : "needs_improvement",
      consistency: totalQuizzes >= 10 ? "high" : totalQuizzes >= 5 ? "medium" : "low",
      recentTrend: recentSuccessRate > successRate ? "improving" : recentSuccessRate < successRate ? "declining" : "stable",
      strongestSubject: Object.values(subjectPerformance).length > 0
        ? Object.values(subjectPerformance).reduce((best, current) =>
          current.successRate > best.successRate ? current : best
        ).name
        : null,
      improvementAreas: Object.values(subjectPerformance)
        .filter(subject => subject.successRate < 60)
        .map(subject => subject.name)
    };

    return res.send({
      success: true,
      data: {
        // Basic stats (maintain backward compatibility)
        totalquizes: totalQuizzes,
        completedquizes: totalQuizzes,
        failquizes: failedQuizzes,
        passquizes: passedQuizzes,

        // Enhanced statistics
        successRate,
        recentSuccessRate,
        totalSubjects: employee?.subjects?.length || 0,

        // Detailed breakdowns
        subjectPerformance: Object.values(subjectPerformance),
        monthlyTrend: monthlyTrendArray,
        recentQuizzes: recentTotal,

        // Insights
        insights,

        // Raw data for detailed analysis
        allQuizzes: quizData.map(quiz => ({
          id: quiz._id,
          quizId: quiz.quiz?._id, // Include the original quiz ID for filtering
          result: quiz.result,
          score: quiz.score,
          marks: quiz.marks,
          subject: quiz.quiz?.subject?.name,
          topic: quiz.quiz?.topic?.name,
          lesson: quiz.quiz?.lesson?.name,
          createdAt: quiz.createdAt
        }))
      },
      message: "Enhanced results retrieved successfully",
    });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};

exports.deleterequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await hrAdminEmployeeRequestModel.findById(id);
    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Request not found"
      });
    }

    // Check if the request belongs to the current employee
    if (request.employee.toString() !== req.user?.profile?._id.toString()) {
      return res.status(200).json({
        success: false,
        message: "You don't have permission to delete this request"
      });
    }

    await hrAdminEmployeeRequestModel.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Request deleted successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

// Get employee statistics for dashboard
exports.getEmployeeStats = asyncHandler(async (req, res) => {
  try {
    const employeeId = req.user?.profile?._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID not found"
      });
    }

    // Get quiz statistics
    const EmployeeQuizesModel = require("../models/employeequizes");
    const quizResults = await EmployeeQuizesModel.find({ employee: employeeId });

    // Calculate statistics
    const completedQuizzes = quizResults.length;
    const passedQuizzes = quizResults.filter(quiz => quiz.result === 'pass').length;
    const successRate = completedQuizzes > 0 ? Math.round((passedQuizzes / completedQuizzes) * 100) : 0;


    // Get subject statistics
    const employeeModel = require("../models/employee");
    const employee = await employeeModel.findById(employeeId).populate('subjects');

    const totalSubjects = employee?.subjects?.length || 0;

    // Calculate in-progress subjects (subjects with some progress but not 100%)
    let inProgressSubjects = 0;
    if (employee?.subjects && employee.subjects.length > 0) {
      const SubjectModel = require("../models/subject");
      const TopicModel = require("../models/topic");
      const LessonsModel = require("../models/LessonsModel");

      for (const subject of employee.subjects) {
        try {
          const subjectWithDetails = await SubjectModel.findById(subject._id)
            .populate({
              path: "topics",
              populate: {
                path: "lessons"
              }
            });

          if (subjectWithDetails && subjectWithDetails.topics) {
            let totalLessons = 0;
            let completedLessons = 0;

            for (const topic of subjectWithDetails.topics) {
              if (topic.lessons && topic.lessons.length > 0) {
                totalLessons += topic.lessons.length;

                for (const lesson of topic.lessons) {
                  const lessonDetails = await LessonsModel.findById(lesson._id);
                  if (lessonDetails && lessonDetails.userProgress) {
                    const employeeProgress = lessonDetails.userProgress.find(
                      progress => progress.user.toString() === employeeId
                    );
                    if (employeeProgress && employeeProgress.progress >= 100) {
                      completedLessons++;
                    }
                  }
                }
              }
            }

            const subjectProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            if (subjectProgress > 0 && subjectProgress < 100) {
              inProgressSubjects++;
            }
          }
        } catch (error) {
          console.error(`Error calculating progress for subject ${subject._id}:`, error);
        }
      }
    }

    const stats = {
      completedQuizzes,
      successRate,
      totalSubjects,
      inProgressSubjects
    };

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Employee statistics retrieved successfully"
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get top performing employees
exports.getTopPerformers = asyncHandler(async (req, res) => {
  try {
    const employeeId = req.user?.profile?._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID not found"
      });
    }

    // Get all employees from the same HR-Admin
    const employeeModel = require("../models/employee");
    const hrAdminModel = require("../models/hr-admin");
    const EmployeeQuizesModel = require("../models/employeequizes");

    // Find the HR-Admin that manages this employee
    const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });

    if (!hrAdmin) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No HR-Admin found for this employee"
      });
    }

    // Get all employees under this HR-Admin
    const employees = await employeeModel
      .find({ _id: { $in: hrAdmin.employees } })
      .populate('auth', 'fullName');

    // Calculate performance for each employee
    const performers = await Promise.all(
      employees.map(async (emp) => {
        const quizResults = await EmployeeQuizesModel.find({ employee: emp._id });
        const totalQuizzes = quizResults.length;
        const totalScore = quizResults.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
        const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

        return {
          _id: emp._id,
          fullName: emp.auth?.fullName || 'Unknown',
          averageScore,
          totalQuizzes
        };
      })
    );

    // Sort by average score (descending) and take top 5
    const topPerformers = performers
      .filter(performer => performer.totalQuizzes > 0) // Only include employees with quiz attempts
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: topPerformers,
      message: "Top performers retrieved successfully"
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get class progress data
exports.getClassProgress = asyncHandler(async (req, res) => {
  try {
    const employeeId = req.user?.profile?._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID not found"
      });
    }

    const employeeModel = require("../models/employee");
    const employee = await employeeModel.findById(employeeId).populate('subjects');

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    if (employee?.subjects && employee.subjects.length > 0) {
      const SubjectModel = require("../models/subject");
      const TopicModel = require("../models/topic");
      const LessonsModel = require("../models/LessonsModel");

      for (const subject of employee.subjects) {
        try {
          const subjectWithDetails = await SubjectModel.findById(subject._id)
            .populate({
              path: "topics",
              populate: {
                path: "lessons"
              }
            });

          if (subjectWithDetails && subjectWithDetails.topics) {
            let totalLessons = 0;
            let completedLessons = 0;

            for (const topic of subjectWithDetails.topics) {
              if (topic.lessons && topic.lessons.length > 0) {
                totalLessons += topic.lessons.length;

                for (const lesson of topic.lessons) {
                  const lessonDetails = await LessonsModel.findById(lesson._id);
                  if (lessonDetails && lessonDetails.userProgress) {
                    const employeeProgress = lessonDetails.userProgress.find(
                      progress => progress.user.toString() === employeeId
                    );
                    if (employeeProgress && employeeProgress.progress >= 100) {
                      completedLessons++;
                    }
                  }
                }
              }
            }

            const subjectProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            if (subjectProgress === 100) {
              completed++;
            } else if (subjectProgress > 0) {
              inProgress++;
            } else {
              notStarted++;
            }
          }
        } catch (error) {
          console.error(`Error calculating progress for subject ${subject._id}:`, error);
          notStarted++;
        }
      }
    }

    // Calculate days left (this could be based on training program duration)
    // For now, using a placeholder calculation
    const daysLeft = Math.max(0, 180 - completed * 30); // Assuming 30 days per subject

    const progressData = {
      completed,
      inProgress,
      notStarted,
      daysLeft
    };

    return res.status(200).json({
      success: true,
      data: progressData,
      message: "Class progress retrieved successfully"
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

