const subjectModel = require("../models/subject");
const { findOne } = require("../models/employee");
const employeeModel = require("../models/employee");
const hrAdminModel = require("../models/hr-admin");
const topicModel = require("../models/topic");
const LessonsModel = require("../models/LessonsModel");

const asyncHandler = require("../utils/asyncHandler");
// Helper to extract full Cloudinary public_id (including folders) from a delivery URL
function extractCloudinaryPublicIdFromUrl(url) {
  try {
    // Example: https://res.cloudinary.com/<cloud>/image/upload/v1699999999/classerly/profile-images/filename.jpg
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    const parts = afterUpload.split('/');
    // Remove version segment if present (starts with 'v' followed by digits)
    if (parts.length && /^v\d+$/i.test(parts[0])) {
      parts.shift();
    }
    // Join remaining as path, remove extension
    const pathWithFile = parts.join('/');
    const withoutExt = pathWithFile.replace(/\.[^.]+$/, '');
    return withoutExt; // e.g., classerly/profile-images/filename
  } catch (_) {
    return null;
  }
}
const fs = require("fs")
// const main = async () => {
//   // Grade-related functionality removed
// }

//   [
// "Dance - open",
// "drama - open",
// "integrated arts - open",
// "Music - open",
// "visual arts - open",
// "Core French, Grade 9 Academic FSF1D",
// "Core French, Grade 9 Open FSF1O",
// "Extended French, Grade 9 Academic FEF1D",
// "French Immersion, Grade 9 Academic FIF1D",
// "MTH1WGrade 9 Issued: 2021 Mathematics",
// "Introduction to business",
// "information and communication technology in business",
// "Issues in Canadian Geography, Grade 9 Academic CGC1D",
// "ENL1WGrade 9 Issued: 2023 English",
// "NAC1OGrade 9 Expressions of First Nations, Métis, and Inuit Cultures",
// "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
// "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
// "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open ",
// "Healthy Active Living Education, Grade 9 Open PPL1O",
// "SNC1WGrade 9 Issued: 2022 science",
// "Food and Nutrition, Grade 9 or 10 Open HFN1O/2O",
// "Exploring Technologies, Grade 9 Open TIJ1O",
// "Science"
//   ].map(async(i)=>{

// const newSubject = await new subjectModel({
//   name: i,
//   grade:grade._id
//   ,image:i.split(" ")[0]+".jpeg"
// }).save();

// grade.subjects.push(newSubject._id);

// })

// await grade.save();
// main()
exports.AddSubject = asyncHandler(async (req, res) => {
  const { name, image, hrAdminIds, createForAll } = req.body;

  try {
    const nameLc = (name || '').toLowerCase();
    if (!nameLc) throw new Error('Subject name is required');

    let targetHrAdmins = [];
    if (createForAll) {
      targetHrAdmins = await hrAdminModel.find({}, '_id');
    } else if (Array.isArray(hrAdminIds) && hrAdminIds.length > 0) {
      targetHrAdmins = await hrAdminModel.find({ _id: { $in: hrAdminIds } }, '_id');
    } else {
      // fallback: current creator. If Instructor, resolve their linked HR-Admins and create for those; if HR-Admin, self
      const currentHR = await hrAdminModel.findOne({ auth: req.user._id }, '_id');
      if (currentHR) {
        targetHrAdmins = [currentHR];
      } else {
        const InstructorModel = require('../models/instructor');
        const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
        if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
          return res.status(403).json({ success: false, message: 'Link to an HR-Admin is required to create content' });
        }
        targetHrAdmins = instructor.hrAdmins.map((id) => ({ _id: id }));
      }
    }

    const created = [];
    for (const admin of targetHrAdmins) {
      const duplicate = await subjectModel.findOne({ name: nameLc, createdBy: admin._id });
      if (duplicate) continue;
      const newSubject = await new subjectModel({ name: nameLc, image, createdBy: admin._id }).save();
      await hrAdminModel.findByIdAndUpdate(admin._id, { $addToSet: { subjects: newSubject._id } });

      // Populate the subject with necessary fields for frontend
      const populatedSubject = await subjectModel.findById(newSubject._id)
        .populate('topics')
        .populate('createdBy', 'name email');

      created.push(populatedSubject);
    }

    // If creating for all HR-Admins, add to global subjects tracking
    if (createForAll && created.length > 0) {
      const SuperAdminControlsModel = require('../models/superAdminControls');
      const globalSubjectIds = created.map(subject => subject._id);

      // Get or create SuperAdminControls document
      let superAdminControls = await SuperAdminControlsModel.findOne();
      if (!superAdminControls) {
        superAdminControls = new SuperAdminControlsModel({ globalSubjects: globalSubjectIds });
      } else {
        superAdminControls.globalSubjects = [...new Set([...superAdminControls.globalSubjects, ...globalSubjectIds])];
      }
      await superAdminControls.save();
    }

    return res.status(200).json({
      success: true,
      message: `Subject created for ${created.length} HR-Admin(s)`,
      data: created,
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

// Utility function to sync global subjects for all existing HR-Admins
exports.syncGlobalSubjectsForAllHRAdmins = asyncHandler(async (req, res) => {
  try {
    const SuperAdminControlsModel = require('../models/superAdminControls');
    const superAdminControls = await SuperAdminControlsModel.findOne();

    if (!superAdminControls || !superAdminControls.globalSubjects || superAdminControls.globalSubjects.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No global subjects found to sync",
        data: []
      });
    }

    const allHRAdmins = await hrAdminModel.find({}, '_id');
    const globalSubjects = await subjectModel.find({ _id: { $in: superAdminControls.globalSubjects } });

    let syncedCount = 0;

    for (const hrAdmin of allHRAdmins) {
      for (const globalSubject of globalSubjects) {
        // Check if this HR-Admin already has a subject with this name
        const existingSubject = await subjectModel.findOne({
          name: globalSubject.name,
          createdBy: hrAdmin._id
        });

        if (!existingSubject) {
          // Create a copy of the global subject for this HR-Admin
          const newSubject = new subjectModel({
            name: globalSubject.name,
            image: globalSubject.image,
            createdBy: hrAdmin._id
          });
          await newSubject.save();

          // Add to HR-Admin's subjects array
          await hrAdminModel.findByIdAndUpdate(hrAdmin._id, {
            $addToSet: { subjects: newSubject._id }
          });

          syncedCount++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Synced ${syncedCount} global subjects for all HR-Admins`,
      data: { syncedCount, totalHRAdmins: allHRAdmins.length }
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

// Utility function to sync global topics, lessons, and quizzes for all existing HR-Admins
exports.syncGlobalContentForAllHRAdmins = asyncHandler(async (req, res) => {
  try {
    const SuperAdminControlsModel = require('../models/superAdminControls');
    const topicModel = require('../models/topic');
    const LessonsModel = require('../models/LessonsModel');
    const QuizesModel = require('../models/quizes');
    const QuestionsModel = require('../models/questions');

    const superAdminControls = await SuperAdminControlsModel.findOne();

    if (!superAdminControls) {
      return res.status(200).json({
        success: true,
        message: "No global content found to sync",
        data: []
      });
    }

    const allHRAdmins = await hrAdminModel.find({}, '_id');
    let syncedCount = { subjects: 0, topics: 0, lessons: 0, quizzes: 0 };

    for (const hrAdmin of allHRAdmins) {
      // Sync global topics
      if (superAdminControls.globalTopics && superAdminControls.globalTopics.length > 0) {
        const globalTopics = await topicModel.find({ _id: { $in: superAdminControls.globalTopics } }).populate('subject');

        for (const globalTopic of globalTopics) {
          const hrAdminSubject = await subjectModel.findOne({
            name: globalTopic.subject.name,
            createdBy: hrAdmin._id
          });

          if (hrAdminSubject) {
            const existingTopic = await topicModel.findOne({
              name: globalTopic.name,
              subject: hrAdminSubject._id,
              createdBy: hrAdmin._id
            });

            if (!existingTopic) {
              const newTopic = new topicModel({
                name: globalTopic.name,
                image: globalTopic.image,
                subject: hrAdminSubject._id,
                createdBy: hrAdmin._id,
                difficulty: globalTopic.difficulty,
                type: globalTopic.type,
                lessonHours: globalTopic.lessonHours,
                practiceHours: globalTopic.practiceHours
              });
              await newTopic.save();

              await subjectModel.findByIdAndUpdate(hrAdminSubject._id, {
                $addToSet: { topics: newTopic._id }
              });

              syncedCount.topics++;
            }
          }
        }
      }

      // Sync global lessons
      if (superAdminControls.globalLessons && superAdminControls.globalLessons.length > 0) {
        const globalLessons = await LessonsModel.find({ _id: { $in: superAdminControls.globalLessons } }).populate('topic');

        for (const globalLesson of globalLessons) {
          const hrAdminTopic = await topicModel.findOne({
            name: globalLesson.topic.name,
            createdBy: hrAdmin._id
          });

          if (hrAdminTopic) {
            const existingLesson = await LessonsModel.findOne({
              name: globalLesson.name,
              topic: hrAdminTopic._id,
              createdBy: hrAdmin._id
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
                createdBy: hrAdmin._id
              });
              await newLesson.save();

              await topicModel.findByIdAndUpdate(hrAdminTopic._id, {
                $addToSet: { lessons: newLesson._id }
              });

              syncedCount.lessons++;
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
          const hrAdminLesson = await LessonsModel.findOne({
            name: globalQuiz.lesson.name,
            createdBy: hrAdmin._id
          });

          if (hrAdminLesson) {
            const existingQuiz = await QuizesModel.findOne({
              createdBy: hrAdmin._id,
              lesson: hrAdminLesson._id
            });

            if (!existingQuiz) {
              const newQuiz = new QuizesModel({
                createdBy: hrAdmin._id,
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

              await topicModel.findByIdAndUpdate(hrAdminLesson.topic, {
                $addToSet: { quizes: newQuiz._id }
              });

              syncedCount.quizzes++;
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Synced global content for all HR-Admins: ${syncedCount.topics} topics, ${syncedCount.lessons} lessons, ${syncedCount.quizzes} quizzes`,
      data: { syncedCount, totalHRAdmins: allHRAdmins.length }
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

exports.getAllSubjects = asyncHandler(async (req, res) => {
  try {
    // HR-Admin: return own subjects. Instructor: union of linked HR-Admins' subjects. Others: empty.
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    let subjects = [];
    if (hrAdmin) {
      subjects = await subjectModel.find({ createdBy: hrAdmin._id })
        .populate('topics')
        .populate('createdBy', 'name email')
        .sort({ order: 1 });
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, message: 'No linked HR-Admins', data: [] });
      }
      subjects = await subjectModel.find({ createdBy: { $in: instructor.hrAdmins } })
        .populate('topics')
        .populate('createdBy', 'name email')
        .sort({ order: 1 });
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({
      success: true,
      message: "All subjects retrieved successfully",
      data: subjects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the subject with populated topics
    let data = await subjectModel.findById(id).populate('topics');

    if (!data) {
      return res.status(200).json({
        success: false,
        message: "Subject not found"
      });
    }

    // Verify ownership: allow HR-Admin or Instructor linked to the owning HR-Admin
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (hrAdmin) {
      if (data.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({ success: false, message: "You don't have permission to delete this subject" });
      }
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !(instructor.hrAdmins || []).some(id => String(id) === String(data.createdBy))) {
        return res.status(403).json({ success: false, message: "You don't have permission to delete this subject" });
      }
    } else {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this subject" });
    }

    // Delete all topics and their lessons
    if (data.topics && data.topics.length > 0) {
      for (const topic of data.topics) {
        // Delete all lessons for this topic
        await LessonsModel.deleteMany({ topic: topic._id });
        // Delete the topic
        await topicModel.findByIdAndDelete(topic._id);
      }
    }

    // Remove the subject from the HR-Admin's subjects array
    await hrAdminModel.findByIdAndUpdate(
      data.createdBy,
      { $pull: { subjects: id } }
    );

    // Delete Cloudinary image if it exists
    if (data.image) {
      try {
        const cloudinary = require('../config/cloudnaryconfig');
        const publicId = extractCloudinaryPublicIdFromUrl(data.image);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        // Continue with deletion even if Cloudinary fails
      }
    }

    // Delete the subject
    await subjectModel.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Subject and all associated topics and lessons deleted successfully"
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});


exports.updateSubject = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await subjectModel.findById(id);
    if (!subject) {
      return res.status(200).json({ success: false, message: "invalid id" });
    }

    // Verify ownership (HR-Admin who created it) or Instructor linked to owning HR-Admin
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (hrAdmin) {
      if (subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({ success: false, message: "You don't have permission to update this subject" });
      }
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !(instructor.hrAdmins || []).some(id => String(id) === String(subject.createdBy))) {
        return res.status(403).json({ success: false, message: "You don't have permission to update this subject" });
      }
    } else {
      return res.status(403).json({ success: false, message: "You don't have permission to update this subject" });
    }

    const updateFields = {};

    if (typeof req.body?.name === 'string' && req.body.name.trim().length > 0) {
      updateFields.name = req.body.name.toLowerCase();
    }

    if (typeof req.body?.image === 'string' && req.body.image.trim().length > 0) {
      // If replacing image, delete previous one from Cloudinary first
      if (subject.image && subject.image !== req.body.image) {
        try {
          const cloudinary = require('../config/cloudnaryconfig');
          const oldPublicId = extractCloudinaryPublicIdFromUrl(subject.image);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        } catch (cloudErr) {
          // Proceed even if cloudinary deletion fails
        }
      }
      updateFields.image = req.body.image;
    }

    // If no valid fields provided, return current subject (no-op)
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ success: true, data: subject, message: "no changes applied" });
    }

    const updated = await subjectModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    return res.status(200).json({ success: true, data: updated, message: "subject updated successfully" });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

// exports.getAlltopicsofsubject = asyncHandler(async (req, res) => {
//   const subjectId = req.params.id;
//   try {
//     const topicsOfSubject = await subjectModel
//       .findById({ _id: subjectId })
//       .populate("subjectTopics");
//     if (!topicsOfSubject) {
//       throw new Error("Subject not found");
//     }
//     const subjectTopics = topicsOfSubject.subjectTopics;
//     res
//       .status(201)
//       .json(new ApiResponse(200, subjectTopics, "Topics Found Succesfuly"));
//   } catch (error) {
//     res.status(200).json({ message: error.message });
//   }
// });

// exports.deleteSubjects = asyncHandler(async (req, res) => {
//   const subjectId = req.params.id;

//   try {
//     const findsubject = await subjectModel.findById({ _id: subjectId });
//     if (!findsubject) {
//       throw new Error("subject not found");
//     }
//     const findgrade = await gradeModel.findById(findsubject.gradeId);
//     if (!findgrade) {
//       throw new Error(500, "Grade not found");
//     }
//     //  const findSubjectInteracher=await
//     findgrade.gradeSubjects = findgrade.gradeSubjects.filter(
//       (subject) => subject._id.toString() == !subjectId
//     );
//     await findgrade.save();

//     await findsubject.deleteOne();
//     res
//       .status(200)
//       .json(new ApiResponse(0.2, findsubject, "subject deleted successfuly"));
//   } catch (error) {
//     const errorMessage = error.message || "something went wrong";
//     return res
//       .status(error.status || 500)
//       .json(new ApiResponse(error.status || 500, errorMessage));
//   }
// });

exports.getParticularStudentSubjects = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await employeeModel.findOne({ auth: studentId })
      .populate({
        path: 'subjects',
        select: 'name image topics createdBy order'
      });

    if (!student) {
      return res.status(200).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: student.subjects,
      message: "Student subjects retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Reorder subjects
exports.reorderSubjects = asyncHandler(async (req, res) => {
  try {
    const { subjects } = req.body; // Array of { id, order }

    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: "Subjects array is required"
      });
    }

    // Update each subject's order
    const updatePromises = subjects.map(({ id, order }) =>
      subjectModel.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Subjects reordered successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});
