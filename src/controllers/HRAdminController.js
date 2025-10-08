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
const InstructorModel = require("../models/instructor");
const hrAdminInstructorRequestModel = require("../models/hradmininstructorrequest");
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
    const isHR = req.user.userType === 'HR-Admin';
    const isInstructor = req.user.userType === 'Instructor';

    if (isHR) {
      try {
        data = await HRAdminModel
          .findOne(
            { _id: req.user?.profile?._id },
            { employees: 1, instructors: 1 }
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
              { path: "subjects", select: ["image", "name"] },
              {
                path: "supervisor",
                select: ["_id"],
                populate: { path: "auth", select: ["fullName"] }
              }
            ],
          })
          .populate({
            path: "instructors",
            select: ["auth", "code"],
            populate: { path: "auth", select: ["userName", "fullName", "email", "image"] }
          });
      } catch (populationError) {
        console.error("Error populating supervisor data:", populationError);
        data = await HRAdminModel
          .findOne(
            { _id: req.user?.profile?._id },
            { employees: 1, instructors: 1 }
          )
          .populate({
            path: "employees",
            select: "auth",
            populate: { path: "auth", select: ["userName", "fullName", "email", "image", "fullAddress"] },
          })
          .populate({
            path: "employees",
            select: ["auth", "code"],
            populate: [{ path: "subjects", select: ["image", "name"] }],
          })
          .populate({
            path: "instructors",
            select: ["auth", "code"],
            populate: { path: "auth", select: ["userName", "fullName", "email", "image"] }
          });
      }
    } else if (isInstructor) {
      // Collect employees across all linked HR-Admins
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [], message: "You have no employees" });
      }

      // Get HR-Admins with employees and merge lists
      const hrAdmins = await HRAdminModel
        .find({ _id: { $in: instructor.hrAdmins } }, { employees: 1 })
        .populate({
          path: "employees",
          select: ["auth", "code", "supervisor", "subjects"],
          populate: [
            { path: "auth", select: ["userName", "fullName", "email", "image", "fullAddress"] },
            { path: "subjects", select: ["image", "name"] },
            { path: "supervisor", select: ["_id"], populate: { path: 'auth', select: ['fullName'] } }
          ]
        });

      const employeeMap = new Map();
      hrAdmins.forEach(hr => {
        (hr.employees || []).forEach(emp => {
          employeeMap.set(String(emp._id), emp);
        });
      });

      data = { employees: Array.from(employeeMap.values()) };
    } else {
      return res.status(200).json({ success: true, data: [], message: "You have no employees" });
    }

    if ((data?.employees?.length || 0) > 0 || (data?.instructors?.length || 0) > 0) {
      let val = [];
      let instructorsList = [];

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

      // Prepare instructors list (simple projection, no progress)
      if (data.instructors && data.instructors.length > 0) {
        instructorsList = data.instructors.map((ins) => ({
          _id: ins._id,
          code: ins.code,
          auth: ins.auth,
        }));
      }

      return res.status(200).json({
        success: true,
        data: { employees: val, instructors: instructorsList },
        message: "Employees and instructors retrieved successfully",
      });
    } else {
      return res
        .status(200)
        .json({ success: true, data: { employees: [], instructors: [] }, message: "You have no employees or instructors" });
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

    // Determine acting HR-Admin context
    let actingHrAdminId = null;
    if (req.user.userType === 'HR-Admin') {
      actingHrAdminId = req.user.profile._id;
    } else if (req.user.userType === 'Supervisor') {
      // Supervisor adds under the HR-Admin that manages the employee (validated below per request)
      actingHrAdminId = req.user.profile._id; // preserved legacy behavior
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }).select('hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(403).json({ success: false, message: 'Instructor must be linked to an HR-Admin to add employees' });
      }
      // Use first linked HR-Admin as acting context by default AND mark request as initiated by Instructor
      actingHrAdminId = instructor.hrAdmins[0];
    } else {
      return res.status(200).json({ success: false, message: "Only HR-Admin, Instructor or Supervisor can add employees" });
    }

    stdId.map(async (i, index) => {
      let std = await EmployeeModel.findOne({ code: i });
      if (!std) {
        return res
          .status(200)
          .json({ success: false, message: "Invalid Employee ID" });
      } else {
        let alreadyregisted = await hrAdminEmployeeRequestModel.findOne({
          hrAdmin: actingHrAdminId,
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
        const basePayload = {
          hrAdmin: actingHrAdminId,
          employee: std._id,
          subjects: subjects
        };
        // If initiated by Instructor, include instructor reference for downstream UI
        const payload = req.user.userType === 'Instructor' ? { ...basePayload, instructor: req.user.profile._id } : basePayload;
        await new hrAdminEmployeeRequestModel(payload).save();
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

// Add instructor by instructor code (similar to addstudent)
exports.addinstructor = asyncHandler(async (req, res) => {
  try {
    const { instructorCodes = [], subjects = [] } = req.body;
    if (!instructorCodes || instructorCodes.length === 0) {
      return res.status(200).json({ success: false, message: "Instructor code is required" });
    }

    // Only HR-Admin can add instructors
    if (req.user.userType !== 'HR-Admin') {
      return res.status(200).json({ success: false, message: "Only HR-Admin can add instructors" });
    }

    for (let index = 0; index < instructorCodes.length; index++) {
      const code = instructorCodes[index];
      const instructor = await InstructorModel.findOne({ code });
      if (!instructor) {
        return res.status(200).json({ success: false, message: "Invalid Instructor Code" });
      }

      const existing = await hrAdminInstructorRequestModel.findOne({
        hrAdmin: req.user.profile._id,
        instructor: instructor._id,
      });
      if (existing) {
        if (existing.status === 'Pending' || existing.status === 'Rejected') {
          return res.status(200).json({ success: false, message: "Already applied for addition" });
        } else {
          return res.status(200).json({ success: false, message: "Already an instructor" });
        }
      }

      await new hrAdminInstructorRequestModel({
        hrAdmin: req.user.profile._id,
        instructor: instructor._id,
        subjects: subjects
      }).save();
    }

    return res.status(200).json({ success: true, message: "Instructor request(s) sent successfully" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// HR-Admin can remove linked instructor
exports.removeInstructor = asyncHandler(async (req, res) => {
  try {
    const { instructorId } = req.params;
    // Only HR-Admin (or Admin) can remove a linked instructor
    if (req.user.userType !== 'HR-Admin' && req.user.userType !== 'Admin') {
      return res.status(200).json({ success: false, message: 'Only HR-Admin or Admin can remove an instructor' });
    }

    const hrAdminId = req.user.profile?._id;

    const hrAdmin = await HRAdminModel.findById(hrAdminId);
    if (!hrAdmin) return res.status(200).json({ success: false, message: "HR-Admin not found" });

    if (!hrAdmin.instructors.includes(instructorId)) {
      return res.status(200).json({ success: false, message: "This instructor is not under your management" });
    }

    await HRAdminModel.findByIdAndUpdate(hrAdminId, { $pull: { instructors: instructorId } });
    const InstructorModel = require('../models/instructor');
    await InstructorModel.findByIdAndUpdate(instructorId, { $pull: { hrAdmins: hrAdminId } });
    await hrAdminInstructorRequestModel.deleteMany({ hrAdmin: hrAdminId, instructor: instructorId });

    return res.status(200).json({ success: true, message: "Instructor removed successfully" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Instructor-side: list my requests (mirror of employee getmyrequests)
exports.getMyInstructorRequests = asyncHandler(async (req, res) => {
  try {
    const requests = await hrAdminInstructorRequestModel
      .find({ instructor: req.user?.profile?._id, $or: [{ status: "Pending" }, { status: "Rejected" }, { status: "Complete" }] })
      .populate({ path: 'hrAdmin', select: 'auth', populate: { path: 'auth', select: ['userName', 'fullName', 'email', 'image', 'fullAddress'] } })
      .populate({ path: 'subjects', select: 'name' });

    return res.status(200).json({ success: true, data: requests, message: "Instructor requests retrieved successfully" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Get instructor requests for HR-Admin (similar to getEmployeeRequests)
exports.getInstructorRequests = asyncHandler(async (req, res) => {
  try {
    let requestsQuery = {};
    if (req.user.userType === 'HR-Admin') {
      requestsQuery = { hrAdmin: req.user.profile._id };
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [], message: 'No linked HR-Admins' });
      }
      requestsQuery = { hrAdmin: { $in: instructor.hrAdmins } };
    } else {
      return res.status(200).json({ success: true, data: [], message: 'No requests available' });
    }

    const requests = await hrAdminInstructorRequestModel
      .find(requestsQuery)
      .populate({
        path: "instructor",
        select: "auth code",
        populate: {
          path: "auth",
          select: ["firstName", "lastName", "fullName", "userName", "email", "image"]
        }
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
      message: "Instructor requests retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Cancel instructor request (only for pending requests)
exports.cancelInstructorRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    let hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // If Instructor, allow cancel if request belongs to any linked HR-Admin
    if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: 'No linked HR-Admins' });
      }
      hrAdminId = { $in: instructor.hrAdmins };
    }

    // Find and validate the instructor request
    const request = await hrAdminInstructorRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Pending"
    });

    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Pending instructor request not found or doesn't belong to you"
      });
    }

    // Delete the instructor request
    await hrAdminInstructorRequestModel.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: "Instructor request cancelled successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Delete instructor request (only for rejected requests)
exports.deleteInstructorRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    let hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // If Instructor, allow delete if request belongs to any linked HR-Admin
    if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: "No linked HR-Admins" });
      }
      hrAdminId = { $in: instructor.hrAdmins };
    }

    // Find and validate the instructor request
    const request = await hrAdminInstructorRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Rejected"
    });

    if (!request) {
      return res.status(200).json({
        success: false,
        message: "Rejected instructor request not found or doesn't belong to you"
      });
    }

    // Delete the instructor request
    await hrAdminInstructorRequestModel.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: "Instructor request deleted successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Instructor accepts/rejects request
exports.updateInstructorRequest = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'Complete' && status !== 'Rejected') {
      return res.status(200).json({ success: false, message: 'Invalid Status' });
    }
    const request = await hrAdminInstructorRequestModel.findById(id);
    if (!request) return res.status(200).json({ success: false, message: 'Invalid Request' });

    await hrAdminInstructorRequestModel.findByIdAndUpdate(id, { status });

    if (status === 'Complete') {
      // Link instructor to HR-Admin
      await HRAdminModel.findByIdAndUpdate(request.hrAdmin, { $addToSet: { instructors: req.user?.profile?._id } });
      // Add instructor subjects (union)
      await InstructorModel.findOneAndUpdate({ auth: req.user._id }, { $addToSet: { subjects: { $each: (request.subjects || []) } }, $addToSet: { hrAdmins: request.hrAdmin } });
    }

    return res.status(200).json({ success: true, message: 'Request updated successfully' });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message || 'Something went wrong' });
  }
});


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

    // Get supervisor count
    const SupervisorModel = require('../models/supervisor');
    const hrAdmin = await HRAdminModel.findById(req.user.profile._id, 'employees');
    let supervisorCount = 0;
    if (hrAdmin && hrAdmin.employees && hrAdmin.employees.length > 0) {
      supervisorCount = await SupervisorModel.countDocuments({
        employeeIds: { $in: hrAdmin.employees }
      });
    }

    res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: {
        employees: data[0]?.employees?.length,
        subject: data[0]?.subjects?.length,
        quizes: data[0]?.quizes?.length,
        games: data[0]?.games?.length,
        supervisors: supervisorCount,
        instructors: data[0]?.instructors?.length || 0,
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
    let query = {};

    // HR-Admin: see own events only
    if (req.user.userType === 'HR-Admin') {
      query = { createdBy: req.user._id };
    }

    // Instructor: see events created by linked HR-Admins or by themselves
    else if (req.user.userType === 'Instructor') {
      try {
        const InstructorModel = require('../models/instructor');
        const HRAdminModel = require('../models/hr-admin');
        const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
        if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
          return res.status(200).json({ success: true, data: [], message: 'No linked HR-Admins' });
        }
        const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'auth');
        const allowedCreators = hrAdmins.map(h => h.auth);
        allowedCreators.push(req.user._id);
        query = { createdBy: { $in: allowedCreators } };
      } catch (e) {
        return res.status(200).json({ success: true, data: [], message: 'No linked HR-Admins' });
      }
    }

    // Other roles: default to their own events
    else {
      query = { createdBy: req.user._id };
    }

    const events = await CallenderEvents.find(query);
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
      // Allow Instructor to edit if the event was created by a linked HR-Admin
      if (req.user.userType === 'Instructor') {
        try {
          const InstructorModel = require('../models/instructor');
          const HRAdminModel = require('../models/hr-admin');
          const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
          if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
            const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'auth');
            const hrAdminAuthIds = new Set(hrAdmins.map(h => String(h.auth)));
            if (!hrAdminAuthIds.has(String(event.createdBy))) {
              return res.status(200).json({ success: false, message: "You are not authorized to edit this event" });
            }
          } else {
            return res.status(200).json({ success: false, message: "You are not authorized to edit this event" });
          }
        } catch (_) {
          return res.status(200).json({ success: false, message: "You are not authorized to edit this event" });
        }
      } else {
        return res.status(200).json({ success: false, message: "You are not authorized to edit this event" });
      }
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
      // Allow Instructor to delete if the event was created by a linked HR-Admin
      if (req.user.userType === 'Instructor') {
        try {
          const InstructorModel = require('../models/instructor');
          const HRAdminModel = require('../models/hr-admin');
          const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
          if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
            const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'auth');
            const hrAdminAuthIds = new Set(hrAdmins.map(h => String(h.auth)));
            if (!hrAdminAuthIds.has(String(event.createdBy))) {
              return res.status(200).json({ success: false, message: "You are not authorized to delete this event" });
            }
          } else {
            return res.status(200).json({ success: false, message: "You are not authorized to delete this event" });
          }
        } catch (_) {
          return res.status(200).json({ success: false, message: "You are not authorized to delete this event" });
        }
      } else {
        return res.status(200).json({ success: false, message: "You are not authorized to delete this event" });
      }
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
    let hrAdminId = req.user.profile._id;

    if (!employeeId) {
      return res.status(200).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Resolve HR-Admin: if Instructor, find linked HR that manages this employee
    let hrAdmin = await HRAdminModel.findById(hrAdminId);
    if (!hrAdmin && req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: 'HR-Admin not found' });
      }
      const fallbackHR = await HRAdminModel.findOne({ _id: { $in: instructor.hrAdmins }, employees: employeeId });
      if (fallbackHR) {
        hrAdmin = fallbackHR;
        hrAdminId = fallbackHR._id;
      }
    }
    // Check if HR-Admin exists
    if (!hrAdmin) {
      return res.status(200).json({
        success: false,
        message: "HR-Admin not found"
      });
    }
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

    // Remove employee from any supervisor's employeeIds array
    try {
      const SupervisorModel = require('../models/supervisor');
      await SupervisorModel.updateMany(
        { employeeIds: employeeId },
        { $pull: { employeeIds: employeeId } }
      );
      console.log(`Employee ${employeeId} removed from supervisor employeeIds arrays`);
    } catch (supervisorError) {
      console.error('Error removing employee from supervisors:', supervisorError.message);
      // Don't fail the main operation if supervisor cleanup fails
    }

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
      const { reportUsageIfChanged } = require('../utils/stripeUsageReporting');
      const subscription = await SubscriptionModel.findOne({ hrAdmin: hrAdminId });

      if (subscription && subscription.stripeSubscriptionId && subscription.stripeCustomerId) {
        const hrAdmin = await HRAdminModel.findById(hrAdminId).populate('employees');
        if (hrAdmin) {
          const seatCount = hrAdmin.employees?.length || 0;

          // Use the lastUsageReported (billing-period aligned) if present to avoid 35-day limit during simulations
          // Prefer end-of-period timestamp to guarantee invoice picks up the 'last' value
          let customTs = null;
          if (subscription.currentPeriodEnd) {
            customTs = Math.floor(new Date(subscription.currentPeriodEnd).getTime() / 1000) - 60;
          } else if (subscription.lastUsageReported) {
            customTs = Math.floor(new Date(subscription.lastUsageReported).getTime() / 1000) + 60;
          }
          try {
            await reportUsageIfChanged(subscription.stripeCustomerId, seatCount, 'employee_seats_last', customTs, !!customTs);
          } catch (e) {
            if (e && typeof e.message === 'string' && (e.message.includes('in future') || e.message.includes('35 days'))) {
              const safeNow = Math.floor(Date.now() / 1000) - 5;
              try { await reportUsageIfChanged(subscription.stripeCustomerId, seatCount, 'employee_seats_last', safeNow, true); } catch (_) { }
            } else { throw e; }
          }

        } else {
          // HR-Admin not found, report 0 seats
          let customTs = null;
          if (subscription.currentPeriodEnd) {
            customTs = Math.floor(new Date(subscription.currentPeriodEnd).getTime() / 1000) - 60;
          } else if (subscription.lastUsageReported) {
            customTs = Math.floor(new Date(subscription.lastUsageReported).getTime() / 1000) + 60;
          }
          try {
            await reportUsageIfChanged(subscription.stripeCustomerId, 0, 'employee_seats_last', customTs, !!customTs);
          } catch (e) {
            if (e && typeof e.message === 'string' && (e.message.includes('in future') || e.message.includes('35 days'))) {
              const safeNow = Math.floor(Date.now() / 1000) - 5;
              try { await reportUsageIfChanged(subscription.stripeCustomerId, 0, 'employee_seats_last', safeNow, true); } catch (_) { }
            } else { throw e; }
          }
        }
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

// Get employee requests for HR-Admin and for Instructor (linked HR-Admins)
exports.getEmployeeRequests = asyncHandler(async (req, res) => {
  try {
    let requestsQuery = {};
    if (req.user.userType === 'HR-Admin') {
      requestsQuery = { hrAdmin: req.user.profile._id };
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [], message: 'No linked HR-Admins' });
      }
      requestsQuery = { hrAdmin: { $in: instructor.hrAdmins } };
    } else {
      return res.status(200).json({ success: true, data: [], message: 'No requests available' });
    }

    const requests = await hrAdminEmployeeRequestModel
      .find(requestsQuery)
      .populate({
        path: "employee",
        select: "auth code",
        populate: {
          path: "auth",
          select: ["firstName", "lastName", "fullName", "userName", "email", "image"]
        },
      })
      .populate({
        path: "instructor",
        select: "auth code",
        populate: {
          path: "auth",
          select: ["firstName", "lastName", "fullName", "userName", "email", "image"]
        }
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
      message: "Requests retrieved successfully"
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
    let hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // If Instructor, allow cancel if request belongs to any linked HR-Admin
    if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: 'No linked HR-Admins' });
      }
      hrAdminId = { $in: instructor.hrAdmins };
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

// Delete employee request (only for rejected requests) - also handles instructor requests
exports.deleteEmployeeRequest = asyncHandler(async (req, res) => {
  try {
    const { requestId } = req.params;
    let hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Handle Instructor case - resolve HR-Admin context
    if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: "No linked HR-Admins" });
      }
      hrAdminId = { $in: instructor.hrAdmins }; // Allow matching any linked HR-Admin
    }

    // First try to find in employee requests
    let request = await hrAdminEmployeeRequestModel.findOne({
      _id: requestId,
      hrAdmin: hrAdminId,
      status: "Rejected"
    });

    if (request) {
      // Delete employee request
      await hrAdminEmployeeRequestModel.findByIdAndDelete(requestId);
      return res.status(200).json({
        success: true,
        message: "Request deleted successfully"
      });
    }

    // If not found in employee requests, try instructor requests (for Instructor users)
    if (req.user.userType === 'Instructor') {
      const instructorId = req.user.profile._id;
      request = await hrAdminInstructorRequestModel.findOne({
        _id: requestId,
        instructor: instructorId,
        status: "Rejected"
      });

      if (request) {
        // Delete instructor request
        await hrAdminInstructorRequestModel.findByIdAndDelete(requestId);
        return res.status(200).json({
          success: true,
          message: "Request deleted successfully"
        });
      }
    }

    // Make deletion idempotent: if it's already gone or not rejected, consider it deleted for UX
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
    let hrAdminId = req.user.profile._id;

    if (!requestId) {
      return res.status(200).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Adjust for Instructor: allow updates for pending requests on any linked HR-Admin
    if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: false, message: "No linked HR-Admins" });
      }
      hrAdminId = { $in: instructor.hrAdmins };
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
    let hrAdminId = req.user.profile._id;

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

    // Verify that the employee belongs to this HR-Admin. If not found and caller is Instructor, try resolving by employee linkage
    let hrAdmin = await HRAdminModel.findById(hrAdminId);
    if (!hrAdmin && req.user.userType === 'Instructor') {
      // Derive the HR-Admin that manages this employee
      const fallbackHR = await HRAdminModel.findOne({ employees: employeeId }).select('_id employees');
      if (fallbackHR) {
        // Ensure this HR is among instructor's linked HRs
        const InstructorModel = require('../models/instructor');
        const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
        if (instructor && (instructor.hrAdmins || []).some(id => String(id) === String(fallbackHR._id))) {
          hrAdmin = fallbackHR;
          hrAdminId = fallbackHR._id;
        }
      }
    }
    if (!hrAdmin) {
      return res.status(200).json({ success: false, message: "HR-Admin not found" });
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

exports.instructorDashboard = asyncHandler(async (req, res) => {
  try {
    const InstructorModel = require('../models/instructor');
    const subjectModel = require('../models/subject');
    const topicModel = require('../models/topic');
    const LessonsModel = require('../models/LessonsModel');
    const QuizesModel = require('../models/quizes');

    const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
    if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
      return res.status(200).json({ success: true, data: { employees: 0, subjects: 0, quizes: 0 }, message: 'No linked HR-Admins' });
    }

    const hrAdminIds = instructor.hrAdmins;

    const subjects = await subjectModel.find({ createdBy: { $in: hrAdminIds } }).select('_id');
    const subjectIds = subjects.map(s => s._id);

    // Employees across HR-Admins
    const HRAdminModel = require('../models/hr-admin');
    const hrAdmins = await HRAdminModel.find({ _id: { $in: hrAdminIds } }, { employees: 1 }).populate('employees');
    const employeeSet = new Set();
    hrAdmins.forEach(hr => (hr.employees || []).forEach(e => employeeSet.add(String(e._id))));

    // Quizzes created by these HR-Admins
    const quizzesCount = await QuizesModel.countDocuments({ createdBy: { $in: hrAdminIds } });

    // Get supervisor count
    const SupervisorModel = require('../models/supervisor');
    const allEmployeeIds = Array.from(employeeSet);
    let supervisorCount = 0;
    if (allEmployeeIds.length > 0) {
      supervisorCount = await SupervisorModel.countDocuments({
        employeeIds: { $in: allEmployeeIds }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data get successfully',
      data: {
        employees: employeeSet.size,
        subject: subjects.length,
        quizes: quizzesCount,
        supervisors: supervisorCount,
      }
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message || 'Something went wrong' });
  }
});

// Get supervisors whose employees are managed by this HR-Admin
exports.getMySupervisors = asyncHandler(async (req, res) => {
  try {
    const SupervisorModel = require('../models/supervisor');

    let hrAdminId;
    const isHR = req.user.userType === 'HR-Admin';
    const isInstructor = req.user.userType === 'Instructor';

    if (isHR) {
      hrAdminId = req.user.profile._id;
    } else if (isInstructor) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [], message: "No linked HR-Admins" });
      }
      // For instructors, we'll get supervisors from all linked HR-Admins
      const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'employees');
      const allEmployeeIds = hrAdmins.flatMap(hr => hr.employees || []);

      // Find supervisors who have any of these employees
      const supervisors = await SupervisorModel.find({ employeeIds: { $in: allEmployeeIds } })
        .populate({ path: 'auth', select: 'fullName email image userName isBlocked' })
        .populate({
          path: 'employeeIds',
          select: 'auth code subjects',
          populate: [
            { path: 'auth', select: 'fullName email image' },
            { path: 'subjects', select: 'name image' }
          ]
        });

      // Filter employees to only show those managed by linked HR-Admins
      const hrEmployeeSet = new Set(allEmployeeIds.map(id => String(id)));
      const filteredSupervisors = supervisors.map(supervisor => {
        const filteredEmployees = (supervisor.employeeIds || []).filter(emp =>
          hrEmployeeSet.has(String(emp._id))
        );
        return {
          ...supervisor.toObject(),
          employeeIds: filteredEmployees,
          employeeCount: filteredEmployees.length
        };
      }).filter(sup => sup.employeeCount > 0);

      return res.status(200).json({
        success: true,
        data: filteredSupervisors,
        message: "Supervisors retrieved successfully"
      });
    } else {
      return res.status(200).json({ success: true, data: [], message: "No supervisors found" });
    }

    // Get HR-Admin's employees
    const hrAdmin = await HRAdminModel.findById(hrAdminId, 'employees');
    if (!hrAdmin || !hrAdmin.employees || hrAdmin.employees.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No employees found for this HR-Admin"
      });
    }

    // Find all supervisors who have any of these employees
    const supervisors = await SupervisorModel.find({
      employeeIds: { $in: hrAdmin.employees }
    })
      .populate({ path: 'auth', select: 'fullName email image userName isBlocked' })
      .populate({
        path: 'employeeIds',
        select: 'auth code subjects',
        populate: [
          { path: 'auth', select: 'fullName email image' },
          { path: 'subjects', select: 'name image' }
        ]
      });

    // Filter supervisor employees to only show those managed by this HR-Admin
    const hrEmployeeSet = new Set(hrAdmin.employees.map(id => String(id)));
    const filteredSupervisors = supervisors.map(supervisor => {
      const filteredEmployees = (supervisor.employeeIds || []).filter(emp =>
        hrEmployeeSet.has(String(emp._id))
      );
      return {
        ...supervisor.toObject(),
        employeeIds: filteredEmployees,
        employeeCount: filteredEmployees.length
      };
    }).filter(sup => sup.employeeCount > 0); // Only include supervisors with at least one HR-Admin managed employee

    return res.status(200).json({
      success: true,
      data: filteredSupervisors,
      message: "Supervisors retrieved successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Update supervisor status (activate/deactivate)
exports.updateSupervisorStatus = asyncHandler(async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(200).json({
        success: false,
        message: "isBlocked must be a boolean value"
      });
    }

    // Check if supervisor exists and is linked to HR admin's employees
    const SupervisorModel = require('../models/supervisor');
    const supervisor = await SupervisorModel.findById(supervisorId)
      .populate({ path: 'auth', select: 'fullName email' });

    if (!supervisor) {
      return res.status(200).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    // For HR-Admin: Check if supervisor has any employees linked to this HR admin
    let hrAdminId = req.user.profile._id;
    let hasAccess = false;

    if (req.user.userType === 'HR-Admin') {
      const hrAdmin = await HRAdminModel.findById(hrAdminId, 'employees');
      if (hrAdmin && hrAdmin.employees && hrAdmin.employees.length > 0) {
        hasAccess = supervisor.employeeIds.some(empId =>
          hrAdmin.employees.some(hrEmpId => String(hrEmpId) === String(empId))
        );
      }
    } else if (req.user.userType === 'Instructor') {
      // For Instructor: Check if supervisor has employees linked to any of instructor's HR admins
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
        const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'employees');
        const allEmployeeIds = hrAdmins.flatMap(hr => hr.employees || []);
        hasAccess = supervisor.employeeIds.some(empId =>
          allEmployeeIds.some(hrEmpId => String(hrEmpId) === String(empId))
        );
      }
    }

    if (!hasAccess) {
      return res.status(200).json({
        success: false,
        message: "You don't have permission to manage this supervisor"
      });
    }

    // Update supervisor status
    const AuthModel = require('../models/auth');
    await AuthModel.findByIdAndUpdate(supervisor.auth._id, { isBlocked });

    return res.status(200).json({
      success: true,
      message: `Supervisor ${isBlocked ? 'deactivated' : 'activated'} successfully`,
      data: {
        supervisorId: supervisor._id,
        supervisorName: supervisor.auth.fullName,
        isBlocked
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Unlink employee from supervisor
exports.unlinkEmployeeFromSupervisor = asyncHandler(async (req, res) => {
  try {
    const { supervisorId, employeeId } = req.params;

    // Check if supervisor exists
    const SupervisorModel = require('../models/supervisor');
    const supervisor = await SupervisorModel.findById(supervisorId)
      .populate({ path: 'auth', select: 'fullName email' });

    if (!supervisor) {
      return res.status(200).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    // Check if employee exists
    const EmployeeModel = require('../models/employee');
    const employee = await EmployeeModel.findById(employeeId)
      .populate({ path: 'auth', select: 'fullName email' });

    if (!employee) {
      return res.status(200).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if employee is linked to this supervisor
    if (!supervisor.employeeIds.includes(employeeId)) {
      return res.status(200).json({
        success: false,
        message: "Employee is not linked to this supervisor"
      });
    }

    // Check permissions - ensure the employee belongs to HR admin or instructor's HR admins
    let hrAdminId = req.user.profile._id;
    let hasAccess = false;

    if (req.user.userType === 'HR-Admin') {
      const hrAdmin = await HRAdminModel.findById(hrAdminId, 'employees');
      hasAccess = hrAdmin && hrAdmin.employees && hrAdmin.employees.includes(employeeId);
    } else if (req.user.userType === 'Instructor') {
      // For Instructor: Check if employee belongs to any of instructor's HR admins
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
        const hrAdmins = await HRAdminModel.find({ _id: { $in: instructor.hrAdmins } }, 'employees');
        const allEmployeeIds = hrAdmins.flatMap(hr => hr.employees || []);
        hasAccess = allEmployeeIds.some(id => String(id) === String(employeeId));
      }
    }

    if (!hasAccess) {
      return res.status(200).json({
        success: false,
        message: "You don't have permission to manage this employee"
      });
    }

    // Remove employee from supervisor's employeeIds array
    await SupervisorModel.findByIdAndUpdate(
      supervisorId,
      { $pull: { employeeIds: employeeId } }
    );

    // Remove supervisor reference from employee
    await EmployeeModel.findByIdAndUpdate(
      employeeId,
      { $unset: { supervisor: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Employee unlinked from supervisor successfully",
      data: {
        supervisorId: supervisor._id,
        supervisorName: supervisor.auth.fullName,
        employeeId: employee._id,
        employeeName: employee.auth.fullName
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

