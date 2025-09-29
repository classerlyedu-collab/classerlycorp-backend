const subjectModel = require("../models/subject");
const EmployeeModel = require("../models/employee");
const HRAdminModel = require("../models/hr-admin");
const ApiResponse = require("../utils/ApiResponse");
// const ApiError = require("../utils/Apierror");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendemail");
const hrAdminEmployeeRequestModel = require("../models/hradminemployeerequest");
const topicModel = require("../models/topic");
const { default: mongoose } = require("mongoose");
const employeeModel = require("../models/employee");
const EmployeeQuizesModel = require("../models/employeequizes");
const CallenderEvents = require("../models/CallenderEvents");
const commentModel = require("../models/comment");
const authModel = require("../models/auth");
const supervisorModel = require("../models/supervisor");
const { getIO } = require("../socket");

exports.registerTeacher = asyncHandler(async (req, res) => {
  try {
    const { fullname, username, emailaddress, password, fulladdress } =
      req.body;
    const existUser = await HRAdminModel.findOne({
      $or: [{ emailaddress }, { username }],
    });
    if (existUser) {
      throw new Error("User already exists");
    }
    const teacher = new HRAdminModel({
      fullname,
      username: username.toLowerCase(),
      emailaddress,
      fulladdress,
      password,
    });
    await teacher.save();
    const emailsubject = "Teacher Registration";
    const email = emailaddress;
    const message = `You are registered successfully as Teacher`;
    const requestType = "Your request for Teacher registration is done";
    await sendEmail(emailsubject, email, message, requestType);
    res
      .status(201)
      .json(new ApiResponse(200, teacher, "teacher created succesfully"));
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.teacherAddsubjects = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;
  const subjectId = req.params.id;
  try {
    const findSubject = await subjectModel.findOne({ _id: subjectId });
    if (!findSubject) {
      throw new Error("Subject not found");
    }

    if (findSubject.subjectTeacher) {
      throw new Error("Subject already has a taken by teacher");
    }

    const existTeacher = await HRAdminModel.findOne({ _id: teacherId });
    if (!existTeacher) {
      throw new Error("Teacher not found");
    }

    existTeacher.teachersSubjects.push(subjectId);
    findSubject.subjectTeacher = teacherId;

    await existTeacher.save();
    await findSubject.save();

    res
      .status(201)
      .json(new ApiResponse(200, findSubject, "Subject added successfully"));
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.allSubjectsOfteacher = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;

  try {
    const findTeacher = await HRAdminModel.findById(teacherId).populate(
      "teachersSubjects"
    );
    const teacherSubjects = findTeacher.teachersSubjects;

    // Initialize an empty array to store subjects and students
    const subjectsWithStudents = [];

    // Iterate over each subject taught by the teacher
    for (const subject of teacherSubjects) {
      // Find students studying the current subject
      const students = await EmployeeModel.find({
        studentSubjects: subject._id,
      }).select("-password");

      // Push subject and corresponding students to the array
      subjectsWithStudents.push({
        subject: subject,
        students: students,
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: subjectsWithStudents,
      message: "Subjects and students of teacher found successfully",
      success: true,
    });
  } catch (error) {
    res.status(200).json({ message: error.message, success: false });
  }
});



exports.myemployees = async (req, res) => {
  try {
    // Import required models
    const SubjectModel = require("../models/subject");
    const TopicModel = require("../models/topic");
    const LessonsModel = require("../models/LessonsModel");
    const EmployeeQuizesModel = require("../models/employeequizes");

    let data;
    try {
      data = await HRAdminModel
        .findOne(
          {
            _id: req.user?.profile?._id,
          },
          { employees: 1 }
        )
        .populate({
          path: "employees",
          select: "auth",
          populate: {
            path: "auth",
            select: ["userName", "fullName", "email", "image", "fullAddress"],
          },
        })
        .populate({
          path: "employees",
          select: ["auth", "code", "supervisor"],
          populate: [
            {
              path: "subjects",
              select: ["image", "name"]
            },
            {
              path: "supervisor",
              select: ["_id"],
              populate: {
                path: "auth",
                select: ["fullName"]
              }
            }
          ],
        });
    } catch (populationError) {
      console.error("Error populating supervisor data:", populationError);
      // Fallback to basic employee data without supervisor
      data = await HRAdminModel
        .findOne(
          {
            _id: req.user?.profile?._id,
          },
          { employees: 1 }
        )
        .populate({
          path: "employees",
          select: "auth",
          populate: {
            path: "auth",
            select: ["userName", "fullName", "email", "image", "fullAddress"],
          },
        })
        .populate({
          path: "employees",
          select: ["auth", "code"],
          populate: [
            {
              path: "subjects",
              select: ["image", "name"]
            }
          ],
        });
    }

    if (data?.employees?.length > 0) {
      let val = [];

      // Process each employee
      for (let i = 0; i < data.employees.length; i++) {
        const employee = data.employees[i];

        // Calculate subject-level progress
        let subjectProgress = [];
        let totalLessons = 0;
        let completedLessons = 0;

        if (employee.subjects && employee.subjects.length > 0) {
          for (const subject of employee.subjects) {
            // Get subject with topics and lessons
            const subjectWithDetails = await SubjectModel.findById(subject._id)
              .populate({
                path: "topics",
                populate: {
                  path: "lessons"
                }
              });

            if (subjectWithDetails && subjectWithDetails.topics) {
              let subjectTotalLessons = 0;
              let subjectCompletedLessons = 0;

              // Calculate progress for each topic in this subject
              for (const topic of subjectWithDetails.topics) {
                if (topic.lessons && topic.lessons.length > 0) {
                  subjectTotalLessons += topic.lessons.length;

                  // Check lesson progress for this employee
                  for (const lesson of topic.lessons) {
                    const lessonDetails = await LessonsModel.findById(lesson._id);

                    if (lessonDetails && lessonDetails.userProgress) {
                      // Find this employee's progress in this lesson
                      const employeeProgress = lessonDetails.userProgress.find(
                        progress => progress.user.toString() === employee._id.toString()
                      );

                      // Consider lesson completed if progress is 100%
                      if (employeeProgress && employeeProgress.progress >= 100) {
                        subjectCompletedLessons++;
                      }
                    }
                  }
                }
              }

              // Add to overall totals
              totalLessons += subjectTotalLessons;
              completedLessons += subjectCompletedLessons;

              // Calculate subject progress percentage
              const subjectProgressPercentage = subjectTotalLessons > 0
                ? Math.round((subjectCompletedLessons / subjectTotalLessons) * 100)
                : 0;

              subjectProgress.push({
                subjectId: subject._id,
                subjectName: subject.name,
                subjectImage: subject.image,
                totalLessons: subjectTotalLessons,
                completedLessons: subjectCompletedLessons,
                progressPercentage: subjectProgressPercentage
              });
            }
          }
        }

        // Calculate overall progress
        const overallProgress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        // Also get quiz data as fallback
        let q = [];
        try {
          q = await EmployeeQuizesModel.find({ employee: employee._id });
        } catch (quizError) {
          // Quiz data is optional, continue without it
        }

        const employeeData = {
          ...employee._doc,
          subjectProgress: subjectProgress,
          overallProgress: {
            total: totalLessons,
            completed: completedLessons,
            percentage: overallProgress
          },
          // Keep quiz data as fallback
          quiz: {
            total: q.length,
            pass: q.filter((quiz) => quiz.result == "pass").length
          }
        };

        val.push(employeeData);
      }

      return res.status(200).json({
        success: true,
        data: val,
        message: "Employees retrieved successfully",
      });
    } else {
      return res
        .status(200)
        .json({ success: true, data: [], message: "You have no employees" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};

exports.addstudent = async (req, res) => {
  try {
    const { stdId, subjects = [] } = req.body;
    if (!stdId) {
      return res
        .status(200)
        .json({ success: false, message: "Employee ID is required" });
    }

    // Allow HR-Admin and Supervisor users to add employees
    if (req.user.userType !== 'HR-Admin' && req.user.userType !== 'Supervisor') {
      return res.status(200).json({
        success: false,
        message: "Only HR-Admin and Supervisor can add employees"
      });
    }

    stdId.map(async (i, index) => {
      let std = await EmployeeModel.findOne({ code: i });
      if (!std) {
        return res
          .status(200)
          .json({ success: false, message: "Invalid Employee ID" });
      } else {
        let alreadyregisted = await hrAdminEmployeeRequestModel.findOne({
          hrAdmin: req.user.profile._id,
          employee: std._id,
        });
        if (alreadyregisted) {
          if (
            alreadyregisted.status == "Pending" ||
            alreadyregisted.status == "Rejected"
          ) {
            return res
              .status(200)
              .json({
                success: false,
                message: "Already applied for addition",
              });
          } else {
            return res
              .status(200)
              .json({ success: false, message: "Already an employee" });
          }
        }
        let str = await new hrAdminEmployeeRequestModel({
          hrAdmin: req.user.profile._id,
          employee: std._id,
          subjects: subjects
        }).save();
      }
      if (index == stdId.length - 1) {
        return res
          .status(200)
          .json({ success: true, message: "Employee added successfully" });
      }
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

exports.mydashboard = async (req, res) => {
  try {
    let data = await HRAdminModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?.profile?._id),
        },
      },
      {
        $lookup: {
          from: "quizes",
          let: { teacherId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$createdBy" }, "$$teacherId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $lookup: {
          from: "games",
          let: { teacherId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$createdBy" }, "$$teacherId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "games",
        },
      },
    ]);
    // let data = await HRAdminModel.findOne({
    //   _id: req.user?.profile?._id

    // })

    res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: {
        employees: data[0]?.employees?.length,
        subject: data[0]?.subjects?.length,
        quizes: data[0]?.quizes?.length,
        games: data[0]?.games?.length,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
exports.mycourses = async (req, res) => {
  try {
    const mycourses = await subjectModel.find({
      _id: { $in: req.user?.profile?.subjects },
    });
    const newcourses = await subjectModel
      .find({
        _id: { $nin: req.user?.profile?.subjects }
      })
      .sort({ _id: -1 });
    res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: {
        mycourses,
        newcourses,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

exports.mysubjects = async (req, res) => {
  try {
    let data = await HRAdminModel
      .findOne({ _id: req.user?.profile?._id })
      .populate({ path: "subjects", select: ["name", "image"] });
    return res.send({
      success: true,
      data: data.subjects,
      message: "subjects get Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const events = await CallenderEvents.find();
    return res.status(200).json({
      success: true,
      data: events,
      message: "Calendar events retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

exports.addCalendarEvent = async (req, res) => {
  try {
    const { title, startDate, endDate, agenda } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(200).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Map old userType values to new ones for backward compatibility
    const userTypeMapping = {
      'Teacher': 'HR-Admin',
      'Student': 'Employee',
      'Parent': 'Supervisor'
    };

    const mappedUserType = userTypeMapping[req.user.userType] || req.user.userType;

    const event = new CallenderEvents({
      title,
      startDate,
      endDate,
      agenda: agenda || "",
      createdBy: req.user._id,
      userType: mappedUserType
    });

    await event.save();
    return res.status(200).json({
      success: true,
      data: event,
      message: "Calendar event created successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

exports.updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startDate, endDate, agenda } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(200).json({
        success: false,
        message: "All fields are required"
      });
    }

    const event = await CallenderEvents.findById(id);
    if (!event) {
      return res.status(200).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user is authorized to edit this event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(200).json({
        success: false,
        message: "You are not authorized to edit this event"
      });
    }

    event.title = title;
    event.startDate = startDate;
    event.endDate = endDate;
    event.agenda = agenda || "";

    await event.save();
    return res.status(200).json({
      success: true,
      data: event,
      message: "Calendar event updated successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CallenderEvents.findById(id);
    if (!event) {
      return res.status(200).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user is authorized to delete this event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(200).json({
        success: false,
        message: "You are not authorized to delete this event"
      });
    }

    await CallenderEvents.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Calendar event deleted successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

// Add a new comment
exports.addComment = asyncHandler(async (req, res) => {
  try {
    const { text, subject, recipientId, recipientType } = req.body;

    if (!text || !recipientId) {
      return res.status(200).json({
        success: false,
        message: "Text and recipient are required"
      });
    }

    // Clean subject field - only include if it's a valid non-empty value
    const cleanSubject = subject && subject !== "" && subject !== "undefined" ? subject : undefined;

    const comment = new commentModel({
      text,
      subject: cleanSubject,
      user: req.user._id,
      userType: req.user.userType,
      recipient: recipientId,
      recipientType
    });

    await comment.save();

    // Populate the comment for socket emission
    const populatedComment = await commentModel.findById(comment._id)
      .populate('user', 'fullName userName image')
      .populate('recipient', 'fullName userName image')
      .populate('subject', 'name image');

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      const currentUserId = req.user._id.toString();
      const recipientIdStr = recipientId.toString();

      const roomId1 = `comment-${currentUserId}-${recipientIdStr}`; // Bilateral room X->Y
      const roomId2 = `comment-${recipientIdStr}-${currentUserId}`; // Bilateral room Y->X
      const payload = { comment: populatedComment, timestamp: new Date() };

      io.to(roomId1).emit('comment-received', payload);
      io.to(roomId2).emit('comment-received', payload);

      // Also send notification to the recipient's notification room
      io.to(`notifications-${recipientIdStr}`).emit('notification-received', payload);
    } catch (socketError) {
      // Continue without throwing error
    }

    return res.status(200).json({
      success: true,
      data: populatedComment,
      message: "Comment added successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get comments between users
exports.getComments = asyncHandler(async (req, res) => {
  try {
    const { recipientId } = req.params;

    // Find all comments where:
    // Either the current user is the sender and recipientId is the recipient
    // OR the current user is the recipient and recipientId is the sender
    const comments = await commentModel.find({
      $or: [
        { user: req.user._id, recipient: recipientId },
        { user: recipientId, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: 1 }) // Sort by creation time, oldest first
      .populate('user', 'fullName userName image')
      .populate('recipient', 'fullName userName image')
      .populate('subject', 'name image'); // Populate subject information

    return res.status(200).json({
      success: true,
      data: comments,
      message: "Comments retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

exports.removeEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const hrAdminId = req.user.profile._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Check if HR-Admin exists
    const hrAdmin = await HRAdminModel.findById(hrAdminId);
    if (!hrAdmin) {
      return res.status(200).json({
        success: false,
        message: "HR-Admin not found"
      });
    }

    // Check if employee exists
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      return res.status(200).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if the employee is actually associated with this HR-Admin
    if (!hrAdmin.employees.includes(employeeId)) {
      return res.status(200).json({
        success: false,
        message: "This employee is not associated with your account"
      });
    }

    // Find all request records for this HR-Admin and Employee
    const employeeRequests = await hrAdminEmployeeRequestModel.find({
      hrAdmin: hrAdminId,
      employee: employeeId,
      status: "Complete"
    });

    // Get all subjects assigned by this HR-Admin to this employee
    const assignedSubjects = [];
    employeeRequests.forEach(request => {
      if (request.subjects && request.subjects.length > 0) {
        assignedSubjects.push(...request.subjects);
      }
    });

    // Remove employee from HR-Admin's employees array
    await HRAdminModel.findByIdAndUpdate(
      hrAdminId,
      { $pull: { employees: employeeId } }
    );

    // Remove only the subjects that were assigned by this specific HR-Admin
    if (assignedSubjects.length > 0) {
      await EmployeeModel.findByIdAndUpdate(
        employeeId,
        { $pullAll: { subjects: assignedSubjects } }
      );
    }

    // Report usage to Stripe for metered billing
    try {
      const SubscriptionModel = require('../models/subscription');
      const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdminId });

      if (subscription && subscription.stripeSubscriptionId && subscription.stripeSubscriptionItemId) {
        const hrAdmin = await HRAdminModel.findById(hrAdminId).populate('employees');
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
          { hrAdmin: hrAdminId },
          { seatCount, lastUsageReported: new Date() }
        );

        console.log(`Usage reported for HR-Admin ${hrAdminId}: ${seatCount} employees`);
      }
    } catch (error) {
      console.error('Error reporting usage to Stripe:', error.message);
      // Don't fail the main operation if usage reporting fails
    }

    // Check if there are any active requests and remove/update them
    await hrAdminEmployeeRequestModel.deleteMany({
      hrAdmin: hrAdminId,
      employee: employeeId
    });

    return res.status(200).json({
      success: true,
      message: "Employee removed successfully from your account and their subjects were updated"
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

// Get employee requests for HR Admin
exports.getEmployeeRequests = asyncHandler(async (req, res) => {
  try {
    const hrAdminId = req.user.profile._id;

    const requests = await hrAdminEmployeeRequestModel
      .find({
        hrAdmin: hrAdminId
      })
      .populate({
        path: "employee",
        select: "auth code",
        populate: {
          path: "auth",
          select: ["firstName", "lastName", "fullName", "userName", "email", "image"]
        },
      })
      .populate({
        path: "subjects",
        select: "name",
        populate: {
          path: "topics",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
      message: "Employee requests retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Cancel employee request (only for pending requests)
exports.cancelEmployeeRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    const hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Find and validate the request
    const request = await hrAdminEmployeeRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Pending"
    });

    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Pending request not found or doesn't belong to you"
      });
    }

    // Delete the request
    await hrAdminEmployeeRequestModel.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: "Request cancelled successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Delete employee request (only for rejected requests)
exports.deleteEmployeeRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    const hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Find and validate the request
    const request = await hrAdminEmployeeRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Rejected"
    });

    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Rejected request not found or doesn't belong to you"
      });
    }

    // Delete the request
    await hrAdminEmployeeRequestModel.findByIdAndDelete(requestId);

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
});

// Update employee request subjects
exports.updateEmployeeRequestSubjects = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    const { subjects } = req.body;
    const hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Find and validate the request (allow updates for pending requests only)
    const request = await hrAdminEmployeeRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Pending"
    });

    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Pending request not found or doesn't belong to you"
      });
    }

    // Update the subjects
    await hrAdminEmployeeRequestModel.findByIdAndUpdate(
      requestId,
      { subjects: subjects },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Request subjects updated successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get employee subject data for HR-Admin
exports.getEmployeeSubjectData = asyncHandler(async (req, res) => {
  try {
    const { employeeId } = req.params;
    const hrAdminId = req.user.profile._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Check if employee belongs to this HR-Admin
    const hrAdmin = await HRAdminModel.findOne({ _id: hrAdminId });
    if (!hrAdmin) {
      return res.status(200).json({
        success: false,
        message: "HR Admin not found"
      });
    }

    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(200).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if employee belongs to this HR-Admin
    const isEmployeeUnderHrAdmin = hrAdmin.employees.some(empId => empId.toString() === employeeId);
    if (!isEmployeeUnderHrAdmin) {
      return res.status(200).json({
        success: false,
        message: "Employee does not belong to you"
      });
    }

    // Get employee subjects with progress data
    const employeeWithSubjects = await employeeModel
      .findById(employeeId)
      .populate({
        path: 'subjects',
        select: 'name image'
      });

    if (!employeeWithSubjects || !employeeWithSubjects.subjects) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No subjects found for this employee"
      });
    }

    // Calculate progress for each subject
    const subjectsWithProgress = await Promise.all(
      employeeWithSubjects.subjects.map(async (subject) => {
        try {
          // Get subject with topics and lessons
          const SubjectModel = require("../models/subject");
          const TopicModel = require("../models/topic");
          const LessonsModel = require("../models/LessonsModel");

          const subjectWithDetails = await SubjectModel.findById(subject._id)
            .populate({
              path: "topics",
              populate: {
                path: "lessons"
              }
            });

          let totalLessons = 0;
          let completedLessons = 0;

          if (subjectWithDetails && subjectWithDetails.topics) {
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
          }

          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return {
            _id: subject._id,
            name: subject.name,
            image: subject.image,
            progress: progress,
            result: progress
          };
        } catch (error) {
          console.error(`Error calculating progress for subject ${subject._id}:`, error);
          return {
            _id: subject._id,
            name: subject.name,
            image: subject.image,
            progress: 0,
            result: 0
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: subjectsWithProgress,
      message: "Employee subject data retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get employee results by subject for HR-Admin
exports.getEmployeeBySubject = asyncHandler(async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { subject } = req.query;
    const hrAdminId = req.user.profile._id;

    if (!employeeId || !subject) {
      return res.status(200).json({
        success: false,
        message: "Employee ID and subject are required"
      });
    }

    // Check if employee belongs to this HR-Admin
    const hrAdmin = await HRAdminModel.findOne({ _id: hrAdminId });
    if (!hrAdmin) {
      return res.status(200).json({
        success: false,
        message: "HR Admin not found"
      });
    }

    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(200).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if employee belongs to this HR-Admin
    const isEmployeeUnderHrAdmin = hrAdmin.employees.some(empId => empId.toString() === employeeId);
    if (!isEmployeeUnderHrAdmin) {
      return res.status(200).json({
        success: false,
        message: "Employee does not belong to you"
      });
    }

    // Get employee quizzes for this subject
    const EmployeeQuizesModel = require("../models/employeequizes");
    const quizzes = await EmployeeQuizesModel.find({
      employee: employeeId,
      subject: subject
    }).populate('quiz');

    // Get employee details
    const employeeDetails = await employeeModel
      .findById(employeeId)
      .populate({
        path: 'auth',
        select: 'fullName userName email image'
      });

    const result = {
      employee: employeeDetails,
      quizzes: quizzes,
      subjectId: subject
    };

    return res.status(200).json({
      success: true,
      data: result,
      message: "Employee results retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Assign subjects directly to employee
exports.assignEmployeeSubjects = asyncHandler(async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { subjects } = req.body;
    const hrAdminId = req.user.profile._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    if (!subjects || !Array.isArray(subjects)) {
      return res.status(200).json({
        success: false,
        message: "Subjects array is required"
      });
    }

    // Verify that the employee belongs to this HR-Admin
    const hrAdmin = await HRAdminModel.findById(hrAdminId);
    if (!hrAdmin) {
      return res.status(200).json({
        success: false,
        message: "HR-Admin not found"
      });
    }

    if (!hrAdmin.employees.includes(employeeId)) {
      return res.status(200).json({
        success: false,
        message: "This employee is not under your management"
      });
    }

    // Get the employee
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(200).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Verify that all subjects exist and belong to this HR-Admin
    const allSubjects = await subjectModel.find({ _id: { $in: subjects }, createdBy: hrAdminId });
    if (allSubjects.length !== subjects.length) {
      return res.status(200).json({
        success: false,
        message: "Some subjects are invalid or don't belong to you"
      });
    }

    // Update employee's subjects by replacing the entire array (removes old subjects)
    await employeeModel.findByIdAndUpdate(
      employeeId,
      { subjects: subjects },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Employee subjects updated successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

