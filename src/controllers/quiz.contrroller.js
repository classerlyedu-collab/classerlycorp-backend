const LessonsModel = require("../models/LessonsModel");
const QuestionsModel = require("../models/questions");
const QuizesModel = require("../models/quizes");
const EmployeeQuizesModel = require("../models/employeequizes");
const subjectModel = require("../models/subject");
const topicModel = require("../models/topic");
const hrAdminModel = require("../models/hr-admin");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

exports.addquiz = asyncHandler(async (req, res) => {
  try {
    const {
      topic,
      subject,
      startsAt,
      endsAt,
      score,
      questions,
      lesson,
      image,
      type,
      hrAdminIds,
      createForAll
    } = req.body;

    // Resolve acting HR-Admin (support Instructors)
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(403).json({ success: false, message: 'Link to an HR-Admin is required to create quizzes' });
      }
    }

    let targetHrAdmins = [];
    if (createForAll) {
      targetHrAdmins = await hrAdminModel.find({}, '_id');
    } else if (Array.isArray(hrAdminIds) && hrAdminIds.length > 0) {
      targetHrAdmins = await hrAdminModel.find({ _id: { $in: hrAdminIds } }, '_id');
    } else {
      // fallback: current HR-Admin or instructor's linked HR-Admins
      if (hrAdmin) targetHrAdmins = [hrAdmin]; else {
        const InstructorModel = require('../models/instructor');
        const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
        targetHrAdmins = (instructor?.hrAdmins || []).map((id) => ({ _id: id }));
      }
    }

    const created = [];
    for (const admin of targetHrAdmins) {
      // Check if lesson exists and belongs to this HR-Admin
      const lessondata = await LessonsModel.findOne({
        _id: lesson,
        createdBy: admin._id
      });

      if (!lessondata) {
        continue; // Skip if lesson doesn't belong to this HR-Admin
      }

      // Check if topic exists and belongs to this HR-Admin
      const topicdata = await topicModel.findOne({
        _id: topic,
        createdBy: admin._id
      });

      if (!topicdata) {
        continue; // Skip if topic doesn't belong to this HR-Admin
      }

      // Check if subject exists and belongs to this HR-Admin
      const subjectdata = await subjectModel.findOne({
        _id: subject,
        createdBy: admin._id
      });

      if (!subjectdata) {
        continue; // Skip if subject doesn't belong to this HR-Admin
      }

      const data = new QuizesModel({
        createdBy: admin._id,
        type: type ?? 'universal',
        topic,
        subject,
        lesson,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        score,
        image,
      });

      let questionarr = [];
      await Promise.all(
        questions.map(async (item) => {
          const { question, options, answer, score } = item;
          let quiz = data._id;
          let questiondata = await new QuestionsModel({
            question,
            options,
            answer,
            score,
            quiz,
          }).save();
          questionarr.push(questiondata._id);
        })
      );
      data.questions = questionarr;
      await data.save();

      // Link quiz to topic
      try {
        await topicModel.findByIdAndUpdate(topic, { $addToSet: { quizes: data._id } });
      } catch (_) { }

      created.push(data);
    }

    // If creating for all HR-Admins, add to global quizzes tracking
    if (createForAll && created.length > 0) {
      const SuperAdminControlsModel = require('../models/superAdminControls');
      const globalQuizIds = created.map(quiz => quiz._id);

      // Get or create SuperAdminControls document
      let superAdminControls = await SuperAdminControlsModel.findOne();
      if (!superAdminControls) {
        superAdminControls = new SuperAdminControlsModel({ globalQuizzes: globalQuizIds });
      } else {
        superAdminControls.globalQuizzes = [...new Set([...superAdminControls.globalQuizzes, ...globalQuizIds])];
      }
      await superAdminControls.save();
    }

    return res.send({
      success: true,
      data: created,
      message: `Quiz created for ${created.length} HR-Admin(s)`,
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatequiz = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid quiz ID format");
    }

    const quizdata = await QuizesModel.findById(id);

    if (!quizdata) {
      throw new Error("Invalid id");
    }
    const { topic, subject, lesson, startsAt, endsAt, score } = req.body;
    const topicdata = await topicModel.findById(topic);

    if (!topicdata) {
      throw new Error("Topic not found");
    }

    const subjectdata = await subjectModel.findById(subject);

    if (!subjectdata) {
      throw new Error("Subject not found");
    }

    const lessondata = await LessonsModel.findById(lesson);

    if (!lessondata) {
      throw new Error("Lesson not found");
    }
    let { questions } = req.body
    delete req.body.questions

    const prevTopicId = quizdata.topic?.toString();
    const data = await QuizesModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    // First, delete all existing questions for this quiz
    await QuestionsModel.deleteMany({ quiz: id });

    // Then create new questions
    let newQuestions = await Promise.all(questions.map(async (question) => {
      const { question: questionText, options, answer, score } = question;


      return await QuestionsModel.create({
        question: questionText,
        options,
        answer,
        score,
        quiz: id,
      })
    }))

    // Update the quiz with the new question IDs
    const questionIds = newQuestions.map(q => q._id);
    await QuizesModel.findByIdAndUpdate(id, { questions: questionIds });

    // If topic changed, reconcile topic.quizes arrays
    try {
      const newTopicId = data.topic?.toString();
      if (prevTopicId && newTopicId && prevTopicId !== newTopicId) {
        await topicModel.findByIdAndUpdate(prevTopicId, { $pull: { quizes: id } });
        await topicModel.findByIdAndUpdate(newTopicId, { $addToSet: { quizes: id } });
      }
    } catch (_) { }

    return res.send({
      success: true,
      data: { ...data, questions: newQuestions },
      message: "Quiz Update Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.deletequiz = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quiz exists and belongs to the teacher or any HR-Admin linked to an Instructor
    let quizdata = await QuizesModel.findOne({ _id: id, createdBy: req.user?.profile?._id });
    if (!quizdata && req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (instructor && instructor.hrAdmins && instructor.hrAdmins.length > 0) {
        quizdata = await QuizesModel.findOne({ _id: id, createdBy: { $in: instructor.hrAdmins } });
      }
    }

    if (!quizdata) {
      throw new Error("Quiz not found or you don't have permission to delete it");
    }

    // Delete the quiz
    const topicId = quizdata.topic?.toString();
    await QuizesModel.findByIdAndDelete(id);

    // Also delete all student quiz attempts and questions for this quiz
    await EmployeeQuizesModel.deleteMany({ quiz: id });
    await QuestionsModel.deleteMany({ quiz: id });

    // Unlink quiz from topic
    try {
      if (topicId) {
        await topicModel.findByIdAndUpdate(topicId, { $pull: { quizes: id } });
      }
    } catch (_) { }

    return res.send({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.addquestion = asyncHandler(async (req, res) => {
  try {
    const { quiz, question, options, answer, score } = req.body;
    const quizdata = await QuizesModel.findOne({
      _id: quiz,
      createdBy: req.user?.profile?._id,
    });

    if (!quizdata) {
      throw new Error("Invalid Quiz Id");
    }
    let questiondata = await new QuestionsModel({
      question,
      options,
      answer,
      score,
      quiz,
    }).save();
    quizdata.questions.push(questiondata._id);
    await quizdata.save();

    return res.send({
      success: true,
      data: quizdata,
      message: "Question added successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.updatequestion = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quiz } = req.body;
    const questiondata = await QuestionsModel.findOne({
      _id: id,
      quiz,
    });

    if (!questiondata) {
      throw new Error("Invalid Question Id");
    }
    let questionupdate = await QuestionsModel.findOneAndUpdate(
      { _id: id, quiz },
      req.body,
      { new: true }
    );

    return res.send({
      success: true,
      data: questionupdate,
      message: "Question updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.deletequestions = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quiz } = req.query;
    const questiondata = await QuestionsModel.findOne({
      _id: id,
      quiz,
    });

    if (!questiondata) {
      throw new Error("Invalid Question Id");
    }
    let questionupdate = await QuestionsModel.findOneAndDelete({
      _id: id,
      quiz,
    });

    return res.send({
      success: true,
      data: questionupdate,
      message: "Question deleted successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatestatusquiz = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const employeeId = req.user?.profile?._id;

    // For employees, verify they are linked to an HR-Admin
    if (req.user.userType === 'Employee') {
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not linked to any HR-Admin"
        });
      }
    }

    const quizdata = await QuizesModel.findById(id).populate("questions");
    if (!quizdata) {
      throw new Error("Invalid id");
    }
    const studentdata = await EmployeeQuizesModel.findOne({
      quiz: id,
      employee: req.user?.profile?._id,
    });
    if (status == "start") {
      // const alreadyquiz = await EmployeeQuizesModel.findOne({
      //   quiz: id,
      //   student: req.user.profile._id,
      // });
      // if (alreadyquiz) {
      //   throw new Error("Already done quiz");
      // }
      const quizsdata = await EmployeeQuizesModel.findOneAndUpdate(
        {
          quiz: id,
          employee: req.user.profile._id,
        },
        {
          questions: quizdata.questions,
          score: quizdata.score,
          marks: 0,
          employee: req.user.profile._id, // Ensure employee field is set
          answers: [], // Reset answers array for new attempt
          status: "start", // Reset status
          result: "awaiting", // Reset result
        },
        { upsert: true }, { new: true }
      );
      // const quizsdata = await new EmployeeQuizesModel({
      //   quiz: id,
      //   student: req.user.profile._id,
      //   questions: quizdata.questions,
      //   score: quizdata.score,
      // }).save();
      return res.send({
        success: true,
        data: quizsdata,
        message: "Quiz started successfully",
      });
    } else if (status === "end") {
      let marks = 0,
        score = 0;

      const questions = quizdata.questions;
      const answers = studentdata.answers;

      // Calculate results based only on questions that were actually answered
      // Filter out questions that don't have answers (for random 10 questions scenario)
      const answeredQuestions = [];
      const answeredAnswers = [];

      // Find all indices that have valid answers (non-null, non-empty)
      const answeredIndices = [];
      for (let index = 0; index < answers.length; index++) {
        if (answers[index] !== undefined && answers[index] !== null && answers[index] !== "" && answers[index].trim() !== "") {
          answeredIndices.push(index);
        }
      }

      // Only process questions that were actually answered
      for (const index of answeredIndices) {
        if (index < questions.length) { // Safety check
          answeredQuestions.push(questions[index]);
          answeredAnswers.push(answers[index]);
        }
      }


      // Use for-loop instead of .map for async/await to work correctly
      for (let index = 0; index < answeredQuestions.length; index++) {
        const q = answeredQuestions[index];
        const studentAnswer = answeredAnswers[index];

        const correct = normalizeAnswer(q.answer, q.options);
        const submitted = normalizeAnswer(studentAnswer, q.options);


        if (correct === submitted) {
          marks += q.score;
        }

        score += q.score;
      }


      const percentage = (marks / score) * 100;
      const result = percentage > 70 ? "pass" : "fail";

      try {
        const quizsdata = await EmployeeQuizesModel.findOneAndUpdate(
          {
            quiz: id,
            employee: req.user.profile._id,
          },
          {
            status: "complete",
            result,
            marks,
            score,
          },
          { new: true }
        );

        return res.send({
          success: true,
          data: {
            ...quizsdata._doc,
            marks,
            score,
            totalQuestions: answeredQuestions.length,
            totalQuizQuestions: questions.length
          },
          message: "Quiz Completed successfully",
        });
      } catch (error) {
        return res.status(500).send({
          success: false,
          message: "Something went wrong while completing the quiz",
        });
      }
    }
    else {
      throw Error("Invalid reqt");
    }
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.getquizes = asyncHandler(async (req, res) => {
  try {

    let { limit, page } = req.query;
    delete req.query.limit;
    delete req.query.page;
    page = page || 0;
    limit = limit || 10;
    const cleanObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(
          ([key, value]) => value !== null && value !== "null" && value !== ""
        )
      );
    };

    req.query = cleanObject(req.query);

    let quizQuery = { ...req.query };

    // For HR-Admins, filter by their own quizzes by default (unless createdBy is explicitly provided)
    if (req.user.userType === "HR-Admin") {
      // If no createdBy is provided in query, default to current HR-Admin's quizzes
      if (!req.query.createdBy) {
        quizQuery.createdBy = req.user.profile._id;
      }
    }
    // For Instructors, show quizzes created by any linked HR-Admin
    else if (req.user.userType === "Instructor") {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.send({ success: true, data: [], message: "No quizzes available" });
      }
      quizQuery.createdBy = { $in: instructor.hrAdmins };
    }
    // For employees, filter by HR-Admin ownership AND assigned subjects
    else if (req.user.userType === "Employee") {
      // Find which HR-Admin this employee belongs to
      const employeeHRAdmin = await hrAdminModel.findOne({
        employees: req.user.profile._id
      });

      if (!employeeHRAdmin) {
        // Employee not found in any HR-Admin, return empty list
        return res.send({
          success: true,
          data: [],
          message: "No quizzes available",
        });
      }

      // Get employee's assigned subjects
      const employeeModel = require("../models/employee");
      const employee = await employeeModel.findById(req.user.profile._id);

      if (!employee || !employee.subjects || employee.subjects.length === 0) {
        // Employee has no assigned subjects, return empty list
        return res.send({
          success: true,
          data: [],
          message: "No subjects assigned. Contact your HR-Admin to assign subjects.",
        });
      }

      // Filter quizzes to only those created by this employee's HR-Admin
      // AND from subjects that the employee is assigned to
      quizQuery.createdBy = employeeHRAdmin._id;
      quizQuery.subject = { $in: employee.subjects };
    }

    let Quizdata = await QuizesModel.find(quizQuery)
      // .skip(page * limit)
      // .limit(limit)
      .populate({ path: "questions" })
      .populate({
        path: "createdBy",
        select: "auth",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "userType"],
        },
      })
      .populate({ path: "subject", select: ["_id", "image", "name"] })
      .populate({
        path: "topic",
        select: ["_id", "image", "name", "difficulty", "type"],
      })
      .populate({ path: "lesson", select: ["_id", "image", "name"] })
      .sort({ _id: -1 });

    if (req.user.userType === "HR-Admin") {
      if (Quizdata.length > 0) {
        return res.send({
          success: true,
          data: Quizdata,
          message: "Quizes get successfully",
        });
      } else {
        return res.send({
          success: true,
          data: [],
          message: "No quizzes available",
        });
      }
    } else {
      if (Quizdata.length > 0) {
        return res.send({
          success: true,
          data: Quizdata.map((i) => {
            return {
              ...i._doc,
              questions: i.questions.map((j) => {
                delete j.answer
                return j._doc
              })
            }
          }),
          message: "Quizes get successfully",
        });
      } else {
        return res.send({
          success: true,
          data: [],
          message: "No quizzes available",
        });
      }
    }
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.getMyQuizesByResult = asyncHandler(async (req, res) => {
  try {
    const { result } = req.query
    const employeeId = req.user?.profile?._id;

    // For employees, verify they are linked to an HR-Admin
    if (req.user.userType === 'Employee') {
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No quizzes available. You are not linked to any HR-Admin."
        });
      }
    }

    let data = await EmployeeQuizesModel.find({
      result,
      employee: employeeId,
    }, { questions: 0, answers: 0 })
      .populate({
        path: "quiz"
      })
      .populate({
        path: "quiz", populate: {
          path: "questions",
          // select:"-answer"
        }
      })

      .populate({ path: "quiz", populate: { path: "topic", select: "name" } })
      .populate({ path: "quiz", populate: { path: "subject", select: "name" } })
      .populate({ path: "quiz", populate: { path: "lesson", select: "name" } })

    // .populate({ path: "quiz", populate: {
    //   path:["subject","lesson","topic"]
    // } })


    return res.send({
      success: true,
      data,
      message: "Student Quizes found successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.addananswer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, index } = req.body;

    const studentquizdata = await EmployeeQuizesModel.findOne({
      quiz: id,
      employee: req.user?.profile?._id,
      // status: "start",
    });
    if (!studentquizdata) {
      throw Error("Invalid quiz");
    }
    if (index > studentquizdata.questions.length) {
      throw Error("Invalid index");
    }

    // Ensure answers array is long enough
    while (studentquizdata.answers.length <= index) {
      studentquizdata.answers.push(null);
    }

    studentquizdata.answers[index] = answer;
    await studentquizdata.save();
    return res.send({
      success: true,
      data: studentquizdata,
      message: "Answer done successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.getstudentquizesbyquizid = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const studentquizdata = (
      await EmployeeQuizesModel
        // .aggregate([
        //     {
        //         $lookup:{
        //             from: "students",
        //             localField: "student",
        //             foreignField: "_id",
        //             as: "student"
        //         }
        //     },
        //     {
        //         $lookup:{
        //             from: "quizes",
        //             localField: "quiz",
        //             foreignField: "_id",
        //             as: "quiz_details"
        //         }
        //     },
        //     {
        //         $lookup:{
        //             from: "questions",
        //             localField: "questions",
        //             foreignField: "_id",
        //             as: "questions"
        //         }
        //     },
        //     {
        //         $unwind: "$quiz_details"
        //       }, {
        //         $match: {
        //           "quiz_details.created_By": req.user?.profile?._id,
        //           status:"complete",
        //           quiz: id,
        //           ...req.query

        //         }
        //       },
        //       {$project:{
        //         "quiz.answer":0
        //       }}
        // ])
        .find({
          quiz: id,
          //   "quiz.createdBy": req.user?.profile?._id,
          status: "complete",
          ...req.query,
        })
        .populate({ path: "quiz", select: "-answer" })
        .populate("student")
        .populate("questions")
    ).filter((i) => {
      return i.quiz.createdBy == req.user?.profile?._id;
    });
    if (studentquizdata.length > 0) {
      return res.send({
        success: true,
        data: studentquizdata,
        message: "Student Quizes done successfully",
      });
    }
    return res.send({
      success: false,
      data: [],
      message: "Student Quizes not found",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatestudentquize = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { score, result } = req.body;
    const studentquizdata = await EmployeeQuizesModel.findById(id).populate([
      "questions",
      "quiz",
      "student",
    ]);

    if (
      !studentquizdata &&
      studentquizdata.quiz.createdBy != req.user?.profile?._id
    ) {
      throw Error("Student Quiz is invalid");
    }
    if (score > studentquizdata.quiz?.score) {
      throw Error("Invalid score");
    }
    studentquizdata.score = score;
    studentquizdata.result = result;
    studentquizdata.status = "result";
    await studentquizdata.save();

    return res.send({
      success: true,
      data: studentquizdata,
      message: "Student Quizes updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});



const normalizeAnswer = (answer, options) => {
  if (!answer) return "";

  const cleaned = answer.trim().toLowerCase();

  // If answer is A/B/C/D → convert to full text using options
  if (["a", "b", "c", "d"].includes(cleaned)) {
    const index = cleaned.charCodeAt(0) - 97; // a=0, b=1, etc.
    return options[index]?.trim().toLowerCase() || "";
  }

  // If answer is 1/2/3/4 → convert to full text using options (0-indexed)
  if (["1", "2", "3", "4"].includes(cleaned)) {
    const index = parseInt(cleaned) - 1; // 1=0, 2=1, etc.
    return options[index]?.trim().toLowerCase() || "";
  }

  return cleaned;
};