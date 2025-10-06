const { json } = require("express");
const SupervisorModel = require("../models/supervisor");
const EmployeeModel = require("../models/employee");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendemail");
const { isValidObjectId, default: mongoose } = require("mongoose");
// const ApiError = require("../utils/Apierror");
const hrAdminModel = require("../models/hr-admin");
const EmployeeQuizesModel = require("../models/employeequizes");
const employeeModel = require("../models/employee");
const NotificationModel = require("../models/notification");
const topicModel = require("../models/topic");
const lessonModel = require('../models/LessonsModel');
const quizesModel = require('../models/quizes');
const SubjectModel = require('../models/subject');
const LessonsModel = require('../models/LessonsModel');

exports.getMyChildsubjectdata = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Get the student and their subjects

    const student = await employeeModel
      .findOne({ _id: id })
      .populate({
        path: "subjects",
        select: ["name", "image"],
        options: { sort: { order: 1 } }
      });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const result = [];

    for (const subject of student.subjects) {
      // Step 2: Get topics related to this subject
      const topics = await topicModel.find({ subject: subject._id })
        .select("_id")
        .sort({ order: 1 });

      const topicIds = topics.map((t) => t._id);

      // Step 3: Get all lessons for those topics
      const lessons = await lessonModel.find({ topic: { $in: topicIds } })
        .sort({ order: 1 });

      const totalLessons = lessons.length;
      let completedLessons = 0;
      for (const lesson of lessons) {
        const lessonDetails = await LessonsModel.findById(lesson._id);
        if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
          const employeeProgress = lessonDetails.userProgress.find(
            progress => progress.user.toString() === id.toString()
          );
          if (employeeProgress && employeeProgress.progress >= 100) {
            completedLessons++;
          }
        }
      }

      const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      result.push({
        _id: subject._id,
        name: subject.name,
        image: subject.image,
        totalLessons,
        completedLessons,
        progress,
      });
    }

    return res.send({
      success: true,
      data: result,
      message: "Subjects with progress fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addNewChild = asyncHandler(async (req, res) => {
  const { stdid } = req.body;
  //   if (!isValidObjectId(parentId)) {
  //     return res.status(200).json({ message: "Invalid parent ID format" });
  //   }
  try {
    const findParent = await SupervisorModel.findById({
      _id: req.user.profile._id,
    });
    const child = await EmployeeModel.findOne({ code: stdid });

    if (!child) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid child Code" });
    }
    if (findParent.employeeIds.includes(child._id)) {
      return res
        .status(200)
        .json({ success: false, message: "Employee Already added" });
    }

    findParent.employeeIds.push(child._id);
    findParent.save();
    await EmployeeModel.findOneAndUpdate(
      { code: stdid },
      { supervisor: findParent._id }
    );
    res
      .status(200)
      .json(new ApiResponse(200, findParent, "employee added successfully"));
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.getMyChilds = asyncHandler(async (req, res) => {
  try {
    const findMychilds = await SupervisorModel.findOne({
      _id: req.user?.profile?._id,
    })
      .populate({
        path: "employeeIds",
        select: "-password",
      })
      .populate({
        path: "employeeIds",
        select: "-password",
        populate: {
          path: "subjects",
          select: ["image", "name"],
          populate: {
            path: "topics",
            select: ["name", "description"],
            populate: {
              path: "lessons",
              select: ["title", "description"]
            }
          }
        },
      })
      .populate({
        path: "employeeIds",
        select: "-password",
        populate: { path: "auth", select: "-password" },
      });

    // Check if parent record exists
    if (!findMychilds) {
      return res.status(404).json({
        success: false,
        message: "Parent record not found. Please contact support."
      });
    }

    // Check if supervisor has employees
    if (!findMychilds.employeeIds || findMychilds.employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No employees found for this supervisor.",
        data: []
      });
    }

    // const findMychilds = await SupervisorModel.aggregate([
    //   {
    //     $match: {
    //       _id: new mongoose.Types.ObjectId(req.user?.profile?._id),
    //     },
    //   },
    //   {
    //     $unwind: "$employeeIds",
    //   },
    //   {
    //     $lookup:{
    //       from:"employees",
    //       foreignField:"_id",
    //       localField:"employeeIds",
    //       as:"childern"
    //     }
    //   },
    //   {
    //     $unwind: "$childern",
    //   },
    //   {
    //     $lookup: {
    //       from: "grades",
    //       // foreignField:"_id",
    //       // localField:"childern.grade",
    //       let: { childid: { $toString: "$childern.grade" } }, // Convert _id to string
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $eq: [{ $toString: "$_id"}, "$$childid"], // Convert topic field to string and compare
    //             },
    //           },
    //         },
    //       ],
    //       as: "grade",
    //     },
    //   },
    // ]);

    setTimeout(async () => {
      try {
        // Check if findMychilds exists and has employeeIds
        if (!findMychilds || !findMychilds.employeeIds) {
          console.log('No supervisor record found or no employees for user:', req.user?.profile?._id);
          return;
        }

        let childs = findMychilds.employeeIds;
        // let d =await Promise.all( childs.map(async (i) => {
        //   return {
        //     ...i._doc,subjects:
        //     await Promise.all(
        //       i.subjects.map(async (j) => {
        //         let quiz = await topicModel.aggregate([
        //           {
        //             $match: {
        //               subject: new mongoose.Types.ObjectId(j._id),
        //             },
        //           },
        //           {
        //             $lookup: {
        //               from: "lessons",
        //               let: { topicId: { $toString: "$_id" } }, // Convert _id to string
        //               pipeline: [
        //                 {
        //                   $match: {
        //                     $expr: {
        //                       $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
        //                     },
        //                   },
        //                 },
        //               ],
        //               as: "lessons",
        //             },
        //           },
        //           // {
        //           //   $match:{
        //           //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
        //           //   }
        //           // },
        //           {
        //             $lookup: {
        //               from: "quizes",
        //               let: { topicId: { $toString: "$_id" } }, // Convert _id to string
        //               pipeline: [
        //                 {
        //                   $match: {
        //                     $expr: {
        //                       $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
        //                     },
        //                   },
        //                 },
        //               ],
        //               as: "quizes",
        //             },
        //           },
        //           {
        //             $unwind: {
        //               path: "$quizes", // Specify the field you want to unwind
        //               preserveNullAndEmptyArrays: true,
        //             },
        //           },

        //           {
        //             $lookup: {
        //               from: "studentquizes",
        //               let: {
        //                 topicId: { $toString: "$quizes._id" },
        //                 stdId: { $toString: i?._id },
        //               }, // Convert _id to string
        //               pipeline: [
        //                 {
        //                   $match: {
        //                     $expr: {
        //                       $and: [
        //                         {
        //                           $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
        //                         },
        //                         {
        //                           $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
        //                         },
        //                       ],
        //                     },
        //                   },
        //                 },
        //               ],
        //               as: "studentquizes",
        //             },
        //           },
        //           {
        //             $group: {
        //               _id: "$_id",
        //               name: { $first: "$name" },

        //               image: { $first: "$image" },

        //               subject: { $first: "$subject" },
        //               difficulty: { $first: "$difficulty" },
        //               type: { $first: "$type" },
        //               lessons: { $first: "$lessons" },

        //               // Group by topic ID
        //               // subject: { $first: "$subject" }, // Keep other fields from the original topic
        //               // name: { $first: "$name" },
        //               quizes: {
        //                 $push: {
        //                   _id: "$quizes._id", // Keep quiz fields
        //                   title: "$quizes.createdBy",
        //                   questions: "$quizes.questions",
        //                   status: "$quizes.status",
        //                   grade: "$quizes.grade",
        //                   topic: "$quizes.topic",
        //                   subject: "$quizes.subject",
        //                   image: "$quizes.image",
        //                   endsAt: "$quizes.endsAt",
        //                   startsAt: "$quizes.startsAt",
        //                   studentQuizData: "$studentquizes", // Embed the student quiz data
        //                 },
        //               },
        //             },
        //           },
        //         ])
        //         return {
        //           ...j._doc,
        //           quiz:quiz.map((q)=>{

        //           }) ,
        //         };
        //       })
        //     )
        //   }

        // }));

        return res
          .status(200)

          .json(new ApiResponse(200, childs, "childs founded succesfully"));
      } catch (error) {
        console.error('Error in setTimeout:', error);
        return res.status(500).json({
          success: false,
          message: "Error processing children data: " + error.message
        });
      }
    }, 100);
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
});

exports.getMyChildbyId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await employeeModel
      .findOne({
        _id: id,
      })
      .populate([
        { path: "auth", select: "-password" },
        {
          path: "subjects",
          select: ["image", "name"],
          options: { sort: { order: 1 } },
          populate: {
            path: "topics",
            select: ["name", "description"],
            options: { sort: { order: 1 } },
            populate: {
              path: "lessons",
              select: ["title", "description", "userProgress"],
              options: { sort: { order: 1 } }
            }
          }
        }
      ]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    console.log("Employee data with subjects:", employee);

    return res
      .status(200)
      .json(new ApiResponse(200, employee, "Employee data retrieved successfully"));
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { subject } = req.query;
    if (!subject) {
      return res
        .status(200)
        .json({
          success: false,
          message: "Missing subject Id",
        });
    }
    const findTopicLesson = await topicModel.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subject),
        },
      },
      {
        $lookup: {
          from: "lessons",
          let: { topicId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"],
                },
              },
            },
          ],
          as: "lessons",
        },
      },
      {
        $lookup: {
          from: "quizes",
          let: { topicId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"],
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $addFields: {
          quizesWithStudent: {
            $map: {
              input: "$quizes",
              as: "quiz",
              in: {
                _id: "$$quiz._id",
                title: "$$quiz.createdBy",
                questions: "$$quiz.questions",
                status: "$$quiz.status",
                topic: "$$quiz.topic",
                subject: "$$quiz.subject",
                image: "$$quiz.image",
                endsAt: "$$quiz.endsAt",
                startsAt: "$$quiz.startsAt",
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "studentquizes",
          let: {
            topicQuizIds: {
              $map: {
                input: "$quizes",
                as: "quiz",
                in: { $toString: "$$quiz._id" }
              }
            },
            studentId: id
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: [{ $toString: "$quiz" }, "$$topicQuizIds"] },
                    { $eq: [{ $toString: "$student" }, "$$studentId"] }
                  ]
                }
              }
            },
            {
              $addFields: {
                quizId: { $toString: "$quiz" }
              }
            }
          ],
          as: "studentQuizData"
        }
      }
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        await Promise.all(
          findTopicLesson.map(async (i) => {
            let { _id, difficulty, name, image, subject, type, quizes, studentQuizData } = i;

            // Match student quiz data with corresponding quizes
            const processedQuizes = quizes.map(quiz => {
              const quizId = quiz._id.toString();
              const matchingStudentQuiz = studentQuizData.find(sq =>
                sq.quizId === quizId
              );

              return {
                _id: quiz._id,
                image: quiz.image || null,
                status: quiz.status || null,
                studentQuizData: matchingStudentQuiz ? [{
                  marks: matchingStudentQuiz.marks,
                  score: matchingStudentQuiz.score,
                  result: matchingStudentQuiz.result,
                  status: matchingStudentQuiz.status,
                  student: matchingStudentQuiz.student,
                  _id: matchingStudentQuiz._id
                }] : []
              };
            });

            return {
              _id,
              difficulty,
              name,
              image,
              subject,
              type,
              quizes: processedQuizes,
              lessons: await Promise.all(
                i.lessons.map(async (j) => {
                  let { name, image, topic } = j;
                  let isCompleted = false;

                  // Check if lesson is completed via userProgress
                  const lessonDetails = await LessonsModel.findById(j._id);
                  if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
                    const employeeProgress = lessonDetails.userProgress.find(
                      progress => progress.user.toString() === id.toString()
                    );
                    if (employeeProgress && employeeProgress.progress >= 100) {
                      isCompleted = true;
                    }
                  }

                  return {
                    name,
                    image,
                    topic,
                    read: isCompleted,
                  };
                })
              ),
            };
          })
        ),
        "Subject details successfully"
      )
    );
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});
// exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { subject } = req.query;
//     if (!subject) {
//       return res
//         .status(200)

//         .json({
//           success: false,
//           message: "Missing subject Id",
//         });
//     }
//     const findTopicLesson = await topicModel.aggregate([
//       {
//         $match: {
//           subject: new mongoose.Types.ObjectId(subject),
//         },
//       },
//       {
//         $lookup: {
//           from: "lessons",
//           let: { topicId: { $toString: "$_id" } }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
//                 },
//               },
//             },
//           ],
//           as: "lessons",
//         },
//       },
//       // {
//       //   $match:{
//       //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
//       //   }
//       // },
//       {
//         $lookup: {
//           from: "quizes",
//           let: { topicId: { $toString: "$_id" } }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
//                 },
//               },
//             },
//           ],
//           as: "quizes",
//         },
//       },
//       {
//         $unwind: {
//           path: "$quizes", // Specify the field you want to unwind
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       {
//         $lookup: {
//           from: "studentquizes",
//           let: {
//             topicId: { $toString: "$quizes._id" },
//             stdId: { $toString: id },
//           }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     {
//                       $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
//                     },
//                     {
//                       $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "studentquizes",
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           name: { $first: "$name" },

//           image: { $first: "$image" },

//           subject: { $first: "$subject" },
//           difficulty: { $first: "$difficulty" },
//           type: { $first: "$type" },
//           lessons: { $first: "$lessons" },

//           // Group by topic ID
//           // subject: { $first: "$subject" }, // Keep other fields from the original topic
//           // name: { $first: "$name" },
//           quizes: {
//             $push: {
//               _id: "$quizes._id", // Keep quiz fields
//               title: "$quizes.createdBy",
//               questions: "$quizes.questions",
//               status: "$quizes.status",
//               grade: "$quizes.grade",
//               topic: "$quizes.topic",
//               subject: "$quizes.subject",
//               image: "$quizes.image",
//               endsAt: "$quizes.endsAt",
//               startsAt: "$quizes.startsAt",
//               studentQuizData: "$studentquizes", // Embed the student quiz data
//             },
//           },
//         },
//       },
//     ]);
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         await Promise.all(
//           findTopicLesson.map(async (i) => {
//             let {_id, difficulty, name, image, subject, type ,quizes} = i;
//             return {
//               _id,
//               difficulty,
//               name,
//               image,
//               subject,
//               type,              
//               quizes: (i.quizes.length>0&&i.quizes[0]?.studentQuizData?.length>0) ?(await Promise.all(
//                 i.quizes.map(async (q) => {
//                   let { grade, image, status ,_id} = q;

//                   return {
//                     _id,
//                     grade:grade?grade:null,
//                     image:image?image:null,
//                     status:status?status:null,
//                     studentQuizData:q?.studentQuizData?.length>0? await Promise.all(
//                       q.studentQuizData.map(async (qs) => {
//                         let { marks, score, result, status, student ,_id} = qs;
//                         return {marks, score, result, status, student,_id};
//                       })
//                     ):[],
//                   };
//                 })
//               )):[],
//               lessons: await Promise.all(
//                 i.lessons.map(async (j) => {
//                 })
//               ),
//             };
//           })
//         ),
//         "Subject details  succesfully"
//       )
//     );
//   } catch (error) {
//     res.status(200).json({ message: error.message });
//   }
// });
// exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { subject } = req.query;
//     if (!subject) {
//       return res.status(200).json({
//         success: false,
//         message: "Missing subject Id",
//       });
//     }
//     const findTopicLesson = await topicModel.aggregate([
//       {
//         $match: {
//           subject: new mongoose.Types.ObjectId(subject),
//         },
//       },
//       {
//         $lookup: {
//           from: "lessons",
//           let: { topicId: { $toString: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"],
//                 },
//               },
//             },
//           ],
//           as: "lessons",
//         },
//       },
//       {
//         $lookup: {
//           from: "quizes",
//           let: { topicId: { $toString: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"],
//                 },
//               },
//             },
//           ],
//           as: "quizes",
//         },
//       },
//       {
//         $unwind: {
//           path: "$quizes",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "studentquizes",
//           let: {
//             quizId: { $toString: "$quizes._id" },
//             studentId: { $toString: id },
//           },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: [{ $toString: "$quiz" }, "$$quizId"] },
//                     { $eq: [{ $toString: "$student" }, "$$studentId"] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "studentQuizData",
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           name: { $first: "$name" },
//           image: { $first: "$image" },
//           subject: { $first: "$subject" },
//           difficulty: { $first: "$difficulty" },
//           type: { $first: "$type" },
//           lessons: { $first: "$lessons" },
//           quizes: {
//             $push: {
//               _id: "$quizes._id",
//               title: "$quizes.createdBy",
//               questions: "$quizes.questions",
//               status: "$quizes.status",
//               grade: "$quizes.grade",
//               topic: "$quizes.topic",
//               subject: "$quizes.subject",
//               image: "$quizes.image",
//               endsAt: "$quizes.endsAt",
//               startsAt: "$quizes.startsAt",
//               studentQuizData: "$studentQuizData",
//             },
//           },
//         },
//       },
//     ]);

//     const formattedResults = await Promise.all(
//       findTopicLesson.map(async (topic) => {
//         const processedQuizes = await Promise.all(
//           topic.quizes
//             .filter(q => q._id) // Filter out null quizzes from unwind
//             .map(async (quiz) => ({
//               _id: quiz._id,
//               title: quiz.title,
//               grade: quiz.grade || null,
//               image: quiz.image || null,
//               status: quiz.status || null,
//               studentQuizData: quiz.studentQuizData.map(sq => ({
//                 marks: sq.marks,
//                 score: sq.score,
//                 result: sq.result,
//                 status: sq.status,
//                 student: sq.student,
//                 _id: sq._id,
//               })),
//             }))
//         );

//         const processedLessons = topic.lessons.map(lesson => ({
//           name: lesson.name,
//           image: lesson.image,
//           topic: lesson.topic,
//         }));

//         return {
//           _id: topic._id,
//           difficulty: topic.difficulty,
//           name: topic.name,
//           image: topic.image,
//           subject: topic.subject,
//           type: topic.type,
//           quizes: processedQuizes,
//           lessons: processedLessons,
//         };
//       })
//     );

//     return res.status(200).json(
//       new ApiResponse(200, formattedResults, "Subject details successfully")
//     );
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

exports.getQuizInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await EmployeeQuizesModel.find({
      student: id,
      status: "complete",
    }).populate({ path: "quiz", populate: { path: "subject" } });
    return res
      .status(200)
      .json({ success: true, data, message: "Quiz data found Successfully" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
exports.getnotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userType = req.user.userType;

    // Find notifications that apply to this user
    const query = {
      $or: [
        // Notifications for all users
        { forAll: true, forType: "All" },
        // Notifications for all users of this user's type
        { forAll: true, forType: userType },
        // Notifications specifically for this user
        { forAll: false, for: userId }
      ]
    };

    const data = await NotificationModel.find(query)
      .sort({ _id: -1 })
      .limit(10);

    return res
      .status(200)
      .json({ success: true, data, message: "Notification get Successfully" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userType = req.user.userType;

    // Find notifications that apply to this user
    const query = {
      $or: [
        // Notifications for all users
        { forAll: true, forType: "All" },
        // Notifications for all users of this user's type
        { forAll: true, forType: userType },
        // Notifications specifically for this user
        { forAll: false, for: userId }
      ]
    };

    // Update all notifications to mark them as read by this user
    const result = await NotificationModel.updateMany(
      {
        ...query,
        "readBy.userId": { $ne: userId } // Only update notifications not already read by this user
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        }
      }
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// Get supervisor statistics for dashboard
exports.getSupervisorStats = asyncHandler(async (req, res) => {
  try {
    const supervisorId = req.user.profile._id;

    // Get supervisor with employees
    const supervisor = await SupervisorModel.findById(supervisorId).populate('employeeIds');
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    const childIds = supervisor.employeeIds.map(employee => employee._id);

    // Calculate statistics
    const totalEmployees = childIds.length;
    const activeEmployees = childIds.length; // Assuming all assigned employees are active

    // Get completed trainings (quizzes passed)
    const completedTrainings = await EmployeeQuizesModel.countDocuments({
      employee: { $in: childIds },
      result: 'pass'
    });

    // Get pending requests (this would depend on your request system)
    const pendingRequests = 0; // Placeholder - implement based on your request system

    // Calculate average performance
    const quizResults = await EmployeeQuizesModel.find({
      employee: { $in: childIds }
    }).populate('employee');

    let totalScore = 0;
    let averagePerformance = 0;

    if (quizResults.length > 0) {
      totalScore = quizResults.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
      averagePerformance = Math.round(totalScore / quizResults.length);
    }

    // Get total quizzes available to the team
    const totalQuizzes = await quizesModel.countDocuments({
      type: { $ne: 'private' }
    });

    const stats = {
      totalEmployees,
      activeEmployees,
      completedTrainings,
      pendingRequests,
      averagePerformance,
      totalQuizzes
    };

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Supervisor statistics retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});

// Get supervisor recent activity
exports.getSupervisorRecentActivity = asyncHandler(async (req, res) => {
  try {
    const supervisorId = req.user.profile._id;

    // Get supervisor with employees
    const supervisor = await SupervisorModel.findById(supervisorId).populate('employeeIds');
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    const childIds = supervisor.employeeIds.map(employee => employee._id);

    // Get recent quiz activities
    const recentQuizzes = await EmployeeQuizesModel.find({
      employee: { $in: childIds }
    })
      .populate({
        path: 'employee',
        populate: {
          path: 'auth',
          select: 'fullName image'
        }
      })
      .populate({
        path: 'quiz',
        populate: {
          path: 'subject',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10);

    // Transform quiz data to activity format
    const activities = recentQuizzes.map(quiz => ({
      _id: quiz._id,
      type: 'quiz_completed',
      employee: {
        _id: quiz.employee._id,
        fullName: quiz.employee.auth.fullName,
        image: quiz.employee.auth.image
      },
      subject: quiz.quiz?.subject ? {
        _id: quiz.quiz.subject._id,
        name: quiz.quiz.subject.name
      } : null,
      score: quiz.score,
      result: quiz.result,
      createdAt: quiz.createdAt,
      message: `${quiz.employee.auth.fullName} completed a quiz in ${quiz.quiz?.subject?.name || 'Unknown Subject'} with ${quiz.score}% score`
    }));

    return res.status(200).json({
      success: true,
      data: activities,
      message: "Recent activity retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});

// Get supervisor team overview (employees with progress)
exports.getSupervisorTeamOverview = asyncHandler(async (req, res) => {
  try {
    const supervisorId = req.user.profile._id;

    // Get supervisor with employees
    const supervisor = await SupervisorModel.findById(supervisorId).populate({
      path: 'employeeIds',
      populate: {
        path: 'auth',
        select: 'fullName email image'
      }
    });

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    const employees = [];

    // Calculate progress for each employee
    for (const employee of supervisor.employeeIds) {
      // Get employee's subjects
      const employeeWithSubjects = await employeeModel.findById(employee._id).populate('subjects');

      if (employeeWithSubjects && employeeWithSubjects.subjects) {
        let totalLessons = 0;
        let completedLessons = 0;

        for (const subject of employeeWithSubjects.subjects) {
          // Get topics for this subject
          const topics = await topicModel.find({ subject: subject._id }).select("_id");
          const topicIds = topics.map(t => t._id);

          // Get lessons for these topics
          const lessons = await lessonModel.find({ topic: { $in: topicIds } });
          totalLessons += lessons.length;

          for (const lesson of lessons) {
            const lessonDetails = await LessonsModel.findById(lesson._id);
            if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
              const employeeProgress = lessonDetails.userProgress.find(
                progress => progress.user.toString() === employee._id.toString()
              );
              if (employeeProgress && employeeProgress.progress >= 100) {
                completedLessons++;
              }
            }
          }
        }

        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        employees.push({
          _id: employee._id,
          auth: employee.auth,
          subjects: employeeWithSubjects.subjects,
          overallProgress: {
            total: totalLessons,
            completed: completedLessons,
            percentage: percentage
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: employees,
      message: "Team overview retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});

// Debug endpoint to check data structure
exports.debugEmployeeData = asyncHandler(async (req, res) => {
  try {
    const supervisorId = req.user.profile._id;

    // Get supervisor with employees
    const supervisor = await SupervisorModel.findById(supervisorId).populate('employeeIds');

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    const debugData = [];

    for (const employee of supervisor.employeeIds) {
      // Get employee with subjects
      const employeeWithSubjects = await employeeModel.findById(employee._id).populate('subjects');

      const employeeDebug = {
        employeeId: employee._id,
        employeeName: employee?.auth?.fullName || 'Unknown',
        subjectsCount: employeeWithSubjects?.subjects?.length || 0,
        subjects: [],
        totalLessons: 0,
        completedLessons: 0
      };

      if (employeeWithSubjects?.subjects?.length > 0) {
        for (const subject of employeeWithSubjects.subjects) {
          // Get subject with topics and lessons
          const subjectWithDetails = await SubjectModel.findById(subject._id)
            .populate({
              path: "topics",
              populate: {
                path: "lessons"
              }
            });

          const subjectDebug = {
            subjectId: subject._id,
            subjectName: subject.name,
            topicsCount: subjectWithDetails?.topics?.length || 0,
            lessonsCount: 0,
            completedLessonsCount: 0
          };

          if (subjectWithDetails?.topics?.length > 0) {
            for (const topic of subjectWithDetails.topics) {
              if (topic.lessons && topic.lessons.length > 0) {
                subjectDebug.lessonsCount += topic.lessons.length;
                employeeDebug.totalLessons += topic.lessons.length;

                // Check each lesson for completion
                for (const lesson of topic.lessons) {
                  const lessonDetails = await LessonsModel.findById(lesson._id);
                  if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
                    const userProgress = lessonDetails.userProgress.find(
                      progress => progress.user.toString() === employee._id.toString()
                    );

                    if (userProgress && userProgress.progress >= 100) {
                      subjectDebug.completedLessonsCount++;
                      employeeDebug.completedLessons++;
                    }
                  }
                }
              }
            }
          }

          employeeDebug.subjects.push(subjectDebug);
        }
      }

      debugData.push(employeeDebug);
    }

    return res.status(200).json({
      success: true,
      message: "Debug data retrieved successfully",
      data: {
        supervisorId: supervisor._id,
        employeesCount: supervisor.employeeIds.length,
        employees: debugData
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Test endpoint to set lesson progress for testing
exports.setLessonProgress = asyncHandler(async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { progress = 100 } = req.body;
    const employeeId = req.user.profile._id;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "Lesson ID is required"
      });
    }

    // Update or create employee progress for this lesson
    const lesson = await LessonsModel.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    // Find existing user progress
    const userProgressIndex = lesson.userProgress.findIndex(
      (up) => up.user.toString() === employeeId.toString()
    );

    if (userProgressIndex !== -1) {
      // Update existing progress
      lesson.userProgress[userProgressIndex].progress = progress;
      lesson.userProgress[userProgressIndex].lastAccessed = new Date();
    } else {
      // Add new user progress
      lesson.userProgress.push({
        user: employeeId,
        progress: progress,
        notes: "Test progress",
        lastAccessed: new Date()
      });
    }

    const updatedLesson = await lesson.save();

    return res.status(200).json({
      success: true,
      message: "Lesson progress updated successfully",
      data: {
        lessonId: updatedLesson._id,
        progress: progress,
        userProgress: updatedLesson.userProgress.find(up => up.user.toString() === employeeId.toString())
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Test endpoint to manually add lesson completion data
exports.testLessonCompletion = asyncHandler(async (req, res) => {
  try {
    const { employeeId, lessonId } = req.params;

    if (!employeeId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Lesson ID are required"
      });
    }

    // Add employee progress to lesson's userProgress field
    const lesson = await LessonsModel.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    // Find existing user progress
    const userProgressIndex = lesson.userProgress.findIndex(
      (up) => up.user.toString() === employeeId.toString()
    );

    if (userProgressIndex !== -1) {
      // Update existing progress to 100%
      lesson.userProgress[userProgressIndex].progress = 100;
      lesson.userProgress[userProgressIndex].lastAccessed = new Date();
    } else {
      // Add new user progress at 100%
      lesson.userProgress.push({
        user: employeeId,
        progress: 100,
        notes: "Test completion",
        lastAccessed: new Date()
      });
    }

    const updatedLesson = await lesson.save();

    return res.status(200).json({
      success: true,
      message: "Lesson completion data added successfully",
      data: {
        lessonId: updatedLesson._id,
        userProgress: updatedLesson.userProgress
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});
