const SupervisorModel = require("../models/supervisor");
const EmployeeModel = require("../models/employee");
const HRAdminModel = require("../models/hr-admin");
const authModel = require("../models/auth");
const asyncHandler = require("../utils/asyncHandler");
const { generateSixDigitCode, generateOTP, generateEmployeeCode } = require("../utils/generateotp");
const sendEmail = require("../utils/sendemail");
const { tokengenerate } = require("../middlewares/auth");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const adminModel = require("../models/admin");
const employeeModel = require("../models/employee");
const supervisorModel = require("../models/supervisor");
const hrAdminModel = require("../models/hr-admin");
const subjectModel = require("../models/subject");
const NotificationModel = require("../models/notification");
const validatesubjectforStudent = async (subject) => {
  let subjectData
  if (subject && subject.length > 0) {
    subjectData = await subjectModel.find({ _id: { $in: subject } });

    if (subjectData.length != subject.length) {
      throw Error("Invalid subject selected");
    }
  }
  return { subjectData }
}
const validatesubjectforTeacher = async (subject) => {
  let subjectData
  if (subject && subject.length > 0) {
    subjectData = await subjectModel.find({ _id: { $in: subject } });

    if (subjectData.length != subject.length) {
      throw Error("Invalid subject selected");
    }
  }
  return { subjectData }
}

exports.register = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      fullName,
      userName,
      password,
      email,
      fullAddress,
      userType,
      parent,
      childIds,
      subject
    } = req.body;
    if (
      [fullName, userName, password, email, userType].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw Error("All fields are required");
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Error("Invalid email address");
    }

    let auth = new authModel({
      fullName,
      userName,
      password,
      email,
      fullAddress,
      userType,
      image: userType == "Employee" ? process.env.DEFAULT_STUDENT_PROFILE_IMAGE : ""
    });
    // let gradeData;
    // if (grade) {
    //   gradeData = await gradeModel.findOne({ _id: grade });
    //   if (!gradeData) {
    //     throw Error("Invalid grade selected");
    //   }
    // }
    // let subjectData;
    // if (subject) {
    //   subjectData = await subjectModel.findOne({ _id:subject });
    //   if (!subjectData) {
    //     throw Error("Invalid subject selected");
    //   }
    // }
    let subjectData
    if (userType == "Employee") {
      let result = await validatesubjectforStudent(subject)
      subjectData = result.subjectData
    } else if (userType == "HR-Admin") {
      let result1 = await validatesubjectforTeacher(subject)
      subjectData = result1.subjectData
    } else if (userType == "Supervisor") {
      subjectData = null
    }


    let profile;
    if (userType == "Employee") {
      // Generate unique employee code
      const employeeCode = await generateEmployeeCode(EmployeeModel);

      if (parent) {
        const prt = await SupervisorModel.findOne({ code: parent });
        if (!prt) {
          throw Error("Invalid parent code");
          // return res.status(200).json({ success: false, message: "Parent Id is invalid" });
        }
        profile = new EmployeeModel({
          auth: auth._id,
          code: employeeCode,
          parent: prt._id,
        });
        prt.childIds.push(profile._id);
        await prt.save();
      } else {
        profile = new EmployeeModel({
          auth: auth._id,
          code: employeeCode,
          subjects: subject
        });
      }
      const emailsubject = "Employee Registration";

      const message = `You are registered successfully. Your employee code is ${employeeCode}. Share this code with your HR-Admin to get added to the system.`;
      const requestType = "Your request for employee registration is done";

      await sendEmail(emailsubject, email, message, requestType);
    } else if (userType == "HR-Admin") {
      profile = new HRAdminModel({ auth: auth._id, subjects: subject || [] });
      if (subjectData && subject && subject.length > 0) {
        await subjectModel.updateMany({
          _id: { $in: subject }
        }, {
          $addToSet: {
            teachers: profile._id
          }
        })
        // subjectData.teachers.push(profile._id);
        // await subjectData.save();
      }

      // Auto-sync global subjects, topics, lessons, and quizzes for new HR-Admin
      try {
        const SuperAdminControlsModel = require('../models/superAdminControls');
        const topicModel = require('../models/topic');
        const LessonsModel = require('../models/LessonsModel');
        const QuizesModel = require('../models/quizes');
        const QuestionsModel = require('../models/questions');

        const superAdminControls = await SuperAdminControlsModel.findOne();

        if (superAdminControls) {
          // Sync global subjects
          if (superAdminControls.globalSubjects && superAdminControls.globalSubjects.length > 0) {
            const globalSubjects = await subjectModel.find({ _id: { $in: superAdminControls.globalSubjects } });

            for (const globalSubject of globalSubjects) {
              const existingSubject = await subjectModel.findOne({
                name: globalSubject.name,
                createdBy: profile._id
              });

              if (!existingSubject) {
                const newSubject = new subjectModel({
                  name: globalSubject.name,
                  image: globalSubject.image,
                  createdBy: profile._id
                });
                await newSubject.save();

                await HRAdminModel.findByIdAndUpdate(profile._id, {
                  $addToSet: { subjects: newSubject._id }
                });
              }
            }
          }

          // Sync global topics
          if (superAdminControls.globalTopics && superAdminControls.globalTopics.length > 0) {
            const globalTopics = await topicModel.find({ _id: { $in: superAdminControls.globalTopics } }).populate('subject');

            for (const globalTopic of globalTopics) {
              // Find the corresponding subject for this HR-Admin
              const hrAdminSubject = await subjectModel.findOne({
                name: globalTopic.subject.name,
                createdBy: profile._id
              });

              if (hrAdminSubject) {
                const existingTopic = await topicModel.findOne({
                  name: globalTopic.name,
                  subject: hrAdminSubject._id,
                  createdBy: profile._id
                });

                if (!existingTopic) {
                  const newTopic = new topicModel({
                    name: globalTopic.name,
                    image: globalTopic.image,
                    subject: hrAdminSubject._id,
                    createdBy: profile._id,
                    difficulty: globalTopic.difficulty,
                    type: globalTopic.type,
                    lessonHours: globalTopic.lessonHours,
                    practiceHours: globalTopic.practiceHours
                  });
                  await newTopic.save();

                  // Add to subject's topics array
                  await subjectModel.findByIdAndUpdate(hrAdminSubject._id, {
                    $addToSet: { topics: newTopic._id }
                  });
                }
              }
            }
          }

          // Sync global lessons
          if (superAdminControls.globalLessons && superAdminControls.globalLessons.length > 0) {
            const globalLessons = await LessonsModel.find({ _id: { $in: superAdminControls.globalLessons } }).populate('topic');

            for (const globalLesson of globalLessons) {
              // Find the corresponding topic for this HR-Admin
              const hrAdminTopic = await topicModel.findOne({
                name: globalLesson.topic.name,
                createdBy: profile._id
              });

              if (hrAdminTopic) {
                const existingLesson = await LessonsModel.findOne({
                  name: globalLesson.name,
                  topic: hrAdminTopic._id,
                  createdBy: profile._id
                });

                if (!existingLesson) {
                  const newLesson = new LessonsModel({
                    name: globalLesson.name,
                    image: globalLesson.image,
                    content: globalLesson.content,
                    words: globalLesson.words,
                    lang: globalLesson.lang,
                    pages: globalLesson.pages,
                    topic: hrAdminTopic._id,
                    createdBy: profile._id
                  });
                  await newLesson.save();

                  // Add to topic's lessons array
                  await topicModel.findByIdAndUpdate(hrAdminTopic._id, {
                    $addToSet: { lessons: newLesson._id }
                  });
                }
              }
            }
          }

          // Sync global quizzes
          if (superAdminControls.globalQuizzes && superAdminControls.globalQuizzes.length > 0) {
            const globalQuizzes = await QuizesModel.find({ _id: { $in: superAdminControls.globalQuizzes } })
              .populate('subject')
              .populate('topic')
              .populate('lesson')
              .populate('questions');

            for (const globalQuiz of globalQuizzes) {
              // Find the corresponding lesson for this HR-Admin
              const hrAdminLesson = await LessonsModel.findOne({
                name: globalQuiz.lesson.name,
                createdBy: profile._id
              });

              if (hrAdminLesson) {
                const existingQuiz = await QuizesModel.findOne({
                  createdBy: profile._id,
                  lesson: hrAdminLesson._id
                });

                if (!existingQuiz) {
                  const newQuiz = new QuizesModel({
                    createdBy: profile._id,
                    type: globalQuiz.type,
                    topic: hrAdminLesson.topic,
                    subject: hrAdminLesson.topic.subject,
                    lesson: hrAdminLesson._id,
                    startsAt: globalQuiz.startsAt,
                    endsAt: globalQuiz.endsAt,
                    score: globalQuiz.score,
                    image: globalQuiz.image
                  });
                  await newQuiz.save();

                  // Create questions for the new quiz
                  const questionIds = [];
                  for (const question of globalQuiz.questions) {
                    const newQuestion = new QuestionsModel({
                      question: question.question,
                      options: question.options,
                      answer: question.answer,
                      score: question.score,
                      quiz: newQuiz._id
                    });
                    await newQuestion.save();
                    questionIds.push(newQuestion._id);
                  }

                  newQuiz.questions = questionIds;
                  await newQuiz.save();

                  // Add to topic's quizzes array
                  await topicModel.findByIdAndUpdate(hrAdminLesson.topic, {
                    $addToSet: { quizes: newQuiz._id }
                  });
                }
              }
            }
          }
        }
      } catch (syncError) {
        console.error('Error syncing global content for new HR-Admin:', syncError);
        // Don't fail the registration if sync fails
      }
    } else if (userType == "Supervisor") {
      if (childIds && childIds.length > 0) {
        const std =
          (await EmployeeModel.find({ code: { $in: childIds } }, { _id: 1 })) ??
          [];

        if (std.length != childIds.length) {
          throw Error("This user is already been added to some other parent");
        }
        profile = new SupervisorModel({
          auth: auth._id,
          childIds: std.map((i) => {
            return i._id;
          }),
          code: generateSixDigitCode(),
        });
        await EmployeeModel.updateMany(
          { code: { $in: childIds } },
          { parent: profile._id }
        );
      } else {
        // Create parent without any children initially
        profile = new SupervisorModel({
          auth: auth._id,
          code: generateSixDigitCode(),
        });
      }
    } else if (userType == "Admin") {
      const admins = await adminModel.find({});
      if (admins.length > 0) {
        throw Error("Admin already registered");
      }
      profile = new adminModel({
        auth: auth._id,
        code: generateSixDigitCode(),
      });
    } else {
      throw Error("UserType must be Student, Teacher or Parent");
    }
    auth.profile = profile._id;
    // Removed auto-notification on signup per requirements
    await auth.save();

    await profile.save();
    auth._doc.profile = profile._doc
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Account created successfully",
      data: {
        ...auth._doc,
        // ...profile._doc,

        token: tokengenerate(auth),
      },
    });
  } catch (e) {
    await session.abortTransaction();

    if (e.code == 11000) {
      return res
        .status(500)
        .json({ success: false, message: "No duplicate username/email acceptable" });
    }
    return res.status(200).json({ success: false, message: e.message });
  }
});

exports.login = asyncHandler(async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      throw Error("userName and password are required");
    }
    // const result = await authModel.aggregate([
    //   // Match the document with the given userName
    //   { $match: { userName: userName } },

    //   {
    //     $addFields: {
    //       profileTable: {
    //         $switch: {
    //           branches: [
    //             { case: { $eq: ["$userType", "Student"] }, then: "students" },
    //             { case: { $eq: ["$userType", "Parent"] }, then: "parents" },
    //             { case: { $eq: ["$userType", "Teacher"] }, then: "teachers" }
    //           ],
    //           default: null
    //         }
    //       }
    //     }
    //   },

    //   // Lookup to join with the appropriate profile collection based on userType
    //   {
    //     $lookup: {
    //       from: "$profileTable" ,
    //       localField: "profile",
    //       foreignField: "_id",
    //       as: "profile"
    //     }
    //   },

    //   // Unwind the profile array (since profile should be a single object, not an array)
    //   { $unwind: "$profile" },

    //   // Conditionally join the grade collection if userType is student
    //   {
    //     $lookup: {
    //       from: "grades",
    //       localField: "profile.grade",
    //       foreignField: "_id",
    //       as: "profile.grade",
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $eq: ["$userType", "Student"]
    //             }
    //           }
    //         }
    //       ]
    //     }
    //   },

    //   // Unwind the grade array (since grade should be a single object, not an array)
    //   { $unwind: { path: "$profile.grade", preserveNullAndEmptyArrays: true } }
    // ]);

    // Assuming you're using async/await
    let auth
    auth = await authModel.findOne({ userName }).populate("profile")
    // .populate({
    //   path: "profile",
    //   populate: {
    //     path: "subjects",
    //   },
    // });
    if (auth && (await bcrypt.compare(password, auth.password))) {
      // auth._doc.profile.grade = {
      //   grade: auth._doc?.profile?.grade?.grade,
      //   _id: auth._doc?.profile?.grade?._id,
      // };
      return res.status(200).json({
        success: true,
        message: "loggedin successfully",
        data: {
          ...auth._doc,

          token: tokengenerate(auth),
        },
      });
    } else {
      throw Error("Invalid credentials");
    }
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
});

exports.forgotpassword = asyncHandler(async (req, res) => {
  try {
    const { userName } = req.body;
    const auth = await authModel.findOne({
      $or: [{ userName }, { email: userName }],
    });
    if (!auth) {
      throw Error("Invalid email or username");
    }
    let otp = generateOTP();
    const emailsubject = "Email for User Verification";

    const message = `Hi ${auth.userName} We received a request to reset your password for your account. Your authentication code is ${otp}.`;
    const requestType = "Your request for forgot password is done";

    await sendEmail(emailsubject, auth.email, message, requestType);
    await authModel.findOneAndUpdate({ _id: auth._id }, { otp });

    let authdata = { ...auth._doc, type: "forgotPassword" };

    return res.status(200).json({
      success: true,
      message: "Kindly check your email for password verification",
      token: tokengenerate(authdata),
    });
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
});
exports.verifyuser = asyncHandler(async (req, res) => {
  try {
    if (req.user.type != "forgotPassword") {
      throw Error("invalid token");
    }
    let auth = await authModel.findOne({
      _id: req.user._id,
      otp: req.body.otp,
    });
    if (!auth) {
      throw Error("Invalid token or otp");
    }
    await authModel.findOneAndUpdate({ _id: req.user._id }, { otp: null });
    let authdata = { ...auth._doc, type: "verify user" };

    return res.status(200).json({
      success: true,
      message: "User Verify successfully",
      token: tokengenerate(authdata),
    });
  } catch (e) {

    res.status(200).json({ success: false, message: e.message });
  }
});
exports.resetpassword = asyncHandler(async (req, res) => {
  try {
    if (req.user.type != "verify user") {
      throw Error("invalid token");
    }
    let { password } = req.body;
    let auth = await authModel.findOne({ _id: req.user._id });
    if (!auth) {
      throw Error("Invalid token");
    }
    await authModel.findOneAndUpdate(
      { _id: req.user._id },
      { password: await bcrypt.hash(password, 10) }
    );
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      token: tokengenerate(auth),
    });
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
});
exports.updateuser = asyncHandler(async (req, res) => {
  try {
    const { userName, image, imageMetadata, email, subjects, emailNotification, notification } = req.body;


    const cleanObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(
          ([key, value]) =>
            value !== null &&
            value !== "null" &&
            value !== undefined &&
            value !== "undefined"
        )
      );
    };

    // Get current user data to check for old image
    const currentUser = await authModel.findById(req.user._id);

    if (email || userName || image || imageMetadata || emailNotification != null || notification != null) {
      // If updating image and there's an old image, delete it from Cloudinary
      if (image && currentUser.imageMetadata && currentUser.imageMetadata.publicId) {
        try {
          const cloud = require("../config/cloudnaryconfig");
          await cloud.uploader.destroy(currentUser.imageMetadata.publicId);
          console.log('Old image deleted from Cloudinary:', currentUser.imageMetadata.publicId);
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
          // Continue with update even if deletion fails
        }
      }

      const updateData = cleanObject({
        userName,
        image,
        imageMetadata,
        email,
        emailNotification,
        notification
      });

      await authModel.findByIdAndUpdate(
        { _id: req.user._id },
        updateData
      );
    }

    if (subjects) {
      switch (req.user.userType) {
        case "Student": {
          await employeeModel.findOneAndUpdate(
            {
              auth: req.user._id,
            },
            { subjects },
            { new: true }
          );
          break;
        }
        case "Teacher": {
          await hrAdminModel.findOneAndUpdate(
            {
              auth: req.user._id,
            },
            { $addToSet: { subjects } },
            { new: true }
          );
          break;
        }
        default: {
        }
      }
    }
    let data = await authModel.findOne({ _id: req.user._id }).populate({
      path: "profile"
    })
    // .populate({
    //   path: "profile",
    //   populate: {
    //     path: "subjects",
    //   },
    // });

    return res.status(200).json({
      success: true,
      message: "user updated successfully",
      data: {
        data,
        token: tokengenerate(data),
      },
    });
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
});
exports.getmyprofile = asyncHandler(async (req, res) => {
  try {
    let data;

    if (req.user.userType == "Student") {
      data = await authModel
        .findOne({ _id: req.user._id }, { password: 0 })
        .populate("profile")
      // return res.status(200).json(data)
    }
    if (req.user.userType == "Employee") {
      data = await authModel
        .findOne({ _id: req.user._id }, { password: 0 })
        .populate("profile")
      // return res.status(200).json(data)
    }
    if (req.user.userType == "Teacher") {
      data = await authModel
        .findOne({ _id: req.user._id }, { password: 0 })
        .populate([
          "profile",
          // "profile.grade",
          // "profile.subjects",
          // "profile.feedback",
        ])
        .populate({
          path: "profile"
        })
      // return res.status(200).json(data)
    }
    if (req.user.userType == "Parent") {
      data = await authModel
        .findOne({ _id: req.user._id }, { password: 0 })
        .populate(["profile", "profile.childIds"]);
    }

    return res.status(200).json({
      success: true,
      data: { ...data._doc, token: tokengenerate(data) },
    });
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
});

exports.changepassword = async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;


    if (password != confirmPassword) {
      return res
        .status(200)
        .json({
          success: false,
          message: "password and confirm password must be same",
        });
    } else if (!(await bcrypt.compare(oldPassword, req.user.password))) {
      return res
        .status(200)
        .json({ success: false, message: "incorrect old password" });
    } else {
      let auth = await authModel.findOneAndUpdate(
        { _id: req.user._id },
        { password: await bcrypt.hash(password, 10) },
        {
          new: true,
        }
      );
      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
        token: tokengenerate(auth),
      });
    }
  } catch (e) {
    res.status(200).json({ success: false, message: e.message });
  }
};
