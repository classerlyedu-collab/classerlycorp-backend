const topicModel = require("../models/topic");
const LessonsModel = require("../models/LessonsModel");
const { find, findById } = require("../models/employee");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const subjectModel = require("../models/subject");
const hrAdminModel = require("../models/hr-admin");
const { default: mongoose } = require("mongoose");
const fs = require("fs");
const XLSX = require("xlsx");

function uniquedata(data) {
  const result = {};
  // Iterate through each object in the array
  for (var i = 0; i < data.length; i++) {
    let val = Object.keys(data[i]);
    let val2 = Object.values(data[i]);
    for (var j = 0; j < val.length; j++) {
      if (!result[val[j]]) {
        result[val[j]] = [];
      }
      result[val[j]].push(
        val2[j]
          .replace(`\n`, " ")
          .replace(`\r`, " ")
          .replace(`/`, " ")
          .replace("\n", " ")
          .replace("\r", " ")
      );
    }
  }

  return result;
}
// const main = async () => {
//   //   const workbook = XLSX.readFile('./Ontario curriculum.xlsx'); // Replace with your Excel file path
//   // const sheetName = workbook.SheetNames[0]; // Read the first sheet (adjust if necessary)
//   // const sheet = workbook.Sheets[sheetName];

//   // // Convert to JSON
//   // const jsonData = XLSX.utils.sheet_to_json(sheet);
//   // let data = uniquedata(jsonData, null, 2);
//   // fs.writeFileSync('data3.json', JSON.stringify(data, null, 2));

//   fs.readFile(__dirname + "/data2.json", "utf8", async (e, d) => {
//     let keys = Object.keys(JSON.parse(d));
//     let values = Object.values(JSON.parse(d));

//     keys.map(async (item, i) => {
//       let grade = await gradeModel.findOne({ grade: item });
//       if (grade) {
//         values[i].map(async (item2, j) => {
//           if (!item2.includes("https")) {
//             try {
//               await subjectModel.findOneAndUpdate(
//                 {
//                   grade: grade._id,
//                   name: item2.trim(),
//                 },
//                 {
//                   $set: {
//                     grade: grade._id,
//                     name: item2.trim(),
//                     topics: [],
//                     image: values[i][j + 1],
//                   },
//                 },
//                 { upsert: true }
//               );
//             } catch (err) { }
//           }
//         });
//       }
//     });
//   });

//   let subject= await subjectModel.findOne({name:"Scienve"})

//   let arr = [
//     {topic:"A1",lessons:[
//       {l:"A1.1",p:6,w:1261},
//     {l:"A1.2",p:8,w:2189},
//     {l:"A1.3",p:4,w:1315},
//     {l:"A1.4",p:8,w:1801},
//     {l:"A1.5",p:8,w:2059},
//     ]},
//     {topic:"B1",lessons:[
//       {l:"B1.1 Relating Science to Our Changing World",p:8,w:1606},
//       {l:"B1.2 Relating Science to Our Changing World",p:7,w:1649},
//       ]},
//     {topic:"B2",lessons:[
//       {l:"B2.1 Investigating and Understanding Concepts",p:7,w:1704},
//       {l:"B2.2 Exploring Ecosystem Equilibrium",p:6,w:1502},
//       {l:"B2.3 Photosynthesis and Cellular Respiration",p:8,w:1843},
//       {l:"B2.4 Introduction to Ecosystem Sustainability",p:7,w:1590},
//       {l:"B2.5 Understanding the Dynamic Equilibrium of Ecosystems",p:8,w:1749},

//     ]},
//     {topic:"C1",lessons:[
//     {l:"C1.1",p:7,w:1676},

//     {l:"C1.2",p:8,w:1839},

//       ]},
//     {topic:"C2",lessons:[
//     {l:"C2.1",p:9,w:7690},
//     {l:"C2.2",p:7,w:1554},
//     {l:"C2.3",p:7,w:1602},
//     {l:"C2.4",p:6,w:1538},
//     {l:"C2.5",p:6,w:1321},
//     {l:"C2.6",p:7,w:1588},
//     {l:"C2.7",p:7,w:1615},

//    ]},
//     {topic:"D1",lessons:[
//       {l:"D1.1",p:1,w:1646},
//       {l:"D1.2",p:7,w:1860},
//       {l:"D1.3",p:7,w:1530},
//       {l:"D1.4",p:7,w:1499}
//       ]},
//     {topic:"D2",lessons:[
//       {l:"D2.1",p:7,w:1871},
//       {l:"D2.2",p:7,w:1651},
//       {l:"D2.3",p:7,w:1554},
//       {l:"D2.4",p:8,w:1667},
//       {l:"D2.5",p:7,w:1441},
//       {l:"D2.6",p:7,w:1655},
//       {l:"D2.7",p:2,w:1562},
//       {l:"D2.8",p:7,w:1416},

//       ]},
//     {topic:"E1",lessons:[
//       {l:"E1.1",p:7,w:1722},
//       {l:"E1.2",p:7,w:1715},
//       {l:"E1.3",p:7,w:1431},
//     ]},
//     {topic:"E2",lessons:[
//       {l:"E2.1",p:2,w:555},
//       {l:"E2.2",p:7,w:1477},
//       {l:"E2.3",p:7,w:1893},
//       {l:"E2.4",p:7,w:1802},
//       {l:"E2.5",p:7,w:1725},
//       {l:"E2.6",p:6,w:1263},
//     ]},
//     {topic:"Strand A",lessons:[
//       {l:"A1. STEM Investigation Skills",p:16,w:4275},
//       {l:"A2. Applications, Careers, and Connections",p:16,w:3809},
//       ]},
//     {topic:"Strand B",lessons:[
//       {l:"B1. Relating Science to Our Changing World",p:15,w:3617},
//       {l:"B2. Investigating and Understanding Concepts",p:15,w:4086},
//       ]},
//     {topic:"Strand C",lessons:[
//       {l:"C1. Relating Science to Our Changing World",p:16,w:4262},
//       {l:"C2. Investigating and Understanding Concepts",p:15,w:3949},
//       ]},
//     {topic:"Strand D",lessons:[
//       {l:"D1. Relating Science to Our Changing World",p:18,w:4348},
//       {l:"D2. Investigating and Understanding Concepts",p:20,w:4670},
//       ]},
//     {topic:"Strand E",lessons:[
//       {l:"E1. Relating Science to Our Changing World",p:18,w:4414},
//       {l:"E2. Investigating and Understanding Concepts_",p:15,w:4161},

//       ]}]

//       arr.forEach(async(i)=>{
//         const newTopic =new topicModel({
//           name: i.topic,
//           image:i.topic.split(" ")[0]+".jpeg",
//           subject:subject._id
//         })

//     i.lessons.map(async(j)=>{
//       const data = await (new LessonsModel({
//         name: j.l,
//         pages:j.p,
//         content:"Science/"+i.topic+"/"+j.l+".docx",
//         image:j.l.split(" ")[0]+".jpeg",
//         topic:newTopic._id,
//         words:j.w,
//       })).save();
//       newTopic.lessons.push(data._id);
//     })
//     await newTopic.save();
//   })
// main();

exports.AddTopic = asyncHandler(async (req, res) => {
  const { name, subject, difficulty, type, hrAdminIds, createForAll } = req.body;

  try {
    // Resolve acting HR-Admin: if user is Instructor, use first linked HR-Admin; else use self
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(403).json({ success: false, message: 'Link to an HR-Admin is required to create topics' });
      }
      // For creation, iterate per target admins below
    }

    // Validate that subject ID is provided
    if (!subject) {
      throw new Error("Subject ID is required");
    }

    let targetHrAdmins = [];
    if (createForAll) {
      targetHrAdmins = await hrAdminModel.find({}, '_id');
    } else if (Array.isArray(hrAdminIds) && hrAdminIds.length > 0) {
      targetHrAdmins = await hrAdminModel.find({ _id: { $in: hrAdminIds } }, '_id');
    } else {
      // fallback: current HR-Admin or instructor's linked admins
      if (hrAdmin) targetHrAdmins = [hrAdmin]; else {
        const InstructorModel = require('../models/instructor');
        const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
        targetHrAdmins = (instructor?.hrAdmins || []).map((id) => ({ _id: id }));
      }
    }

    const created = [];
    for (const admin of targetHrAdmins) {
      // Find the subject and verify it belongs to the current HR-Admin
      const findSubject = await subjectModel.findOne({
        _id: subject,
        createdBy: admin._id
      }).populate("topics");

      if (!findSubject) {
        continue; // Skip if subject doesn't belong to this HR-Admin
      }

      const findTopic = await topicModel.findOne({
        name: name.toLowerCase(),
        subject,
        createdBy: admin._id,
      });
      if (findTopic) {
        continue; // Skip if topic already exists for this HR-Admin
      }

      if (!["Beginner", "Medium", "Advanced"].includes(difficulty)) {
        throw new Error(
          "difficulty is not valid. it only be Beginner,Medium or Advanced "
        );
      }

      const newTopic = await new topicModel({
        name: name.toLowerCase(),
        subject,
        createdBy: admin._id,
        difficulty,
        type: type ? type : "Standard",
      }).save();

      findSubject.topics.push(newTopic._id);
      await findSubject.save();

      // Populate the topic with necessary fields for frontend
      const populatedTopic = await topicModel.findById(newTopic._id)
        .populate('subject', 'name image')
        .populate('lessons')
        .populate('createdBy', 'name email');

      created.push(populatedTopic);
    }

    // If creating for all HR-Admins, add to global topics tracking
    if (createForAll && created.length > 0) {
      const SuperAdminControlsModel = require('../models/superAdminControls');
      const globalTopicIds = created.map(topic => topic._id);

      // Get or create SuperAdminControls document
      let superAdminControls = await SuperAdminControlsModel.findOne();
      if (!superAdminControls) {
        superAdminControls = new SuperAdminControlsModel({ globalTopics: globalTopicIds });
      } else {
        superAdminControls.globalTopics = [...new Set([...superAdminControls.globalTopics, ...globalTopicIds])];
      }
      await superAdminControls.save();
    }

    res.status(200).json({
      success: true,
      message: `Topic created for ${created.length} HR-Admin(s)`,
      data: created
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

exports.updatetopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    let data = await topicModel.findById(id);
    if (!data) {
      throw Error("invalid id");
    } else {
      if (
        req.body.difficulty &&
        !["Beginner", "Medium", "Advanced"].includes(req.body.difficulty)
      ) {
        throw new Error(
          "difficulty is not valid. it only be Beginner,Medium or Advanced "
        );
      }
      if (req.body.name) {
        req.body.name = req.body.name.toLowerCase();
        const duplicateTopic = await topicModel.findOne({
          name: req.body.name,
          subject: data.subject,
          _id: { $ne: id }
        });
        if (duplicateTopic) {
          throw new Error(
            "Topic with this name already exists in this subject"
          );
        }
      }
      const { name, image, difficulty } = req.body;
      req.body = { name, image, difficulty };
      for (let prop in req.body) {
        if (req.body[prop] === null || req.body[prop] === undefined) {
          delete req.body[prop];
        }
      }
      const updated = await topicModel.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: "topic updated successfully",
      });
    }
  } catch (error) {
    res.status(200).json({ mesage: error.message });
  }
});

exports.getAllTopics = asyncHandler(async (req, res) => {
  try {
    // Resolve context: HR-Admin sees own topics; Instructor sees topics from linked HR-Admins
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    let subjectIds = [];
    if (hrAdmin) {
      const hrAdminSubjects = await subjectModel.find({ createdBy: hrAdmin._id }).select('_id');
      subjectIds = hrAdminSubjects.map(subject => subject._id);
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [], message: 'No linked HR-Admins' });
      }
      const subjects = await subjectModel.find({ createdBy: { $in: instructor.hrAdmins } }).select('_id');
      subjectIds = subjects.map(s => s._id);
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    // Find topics that belong to the HR-Admin's subjects
    const topics = await topicModel.find({ subject: { $in: subjectIds } })
      .populate('subject', 'name image')
      .populate('lessons')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All topics retrieved successfully",
      data: topics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Simple function to get topics by subject ID (for Add Quiz dropdown)
exports.getTopicsBySubject = asyncHandler(async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }

    // Verify ownership for HR-Admin or Instructor (linked)
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    let subject;
    if (hrAdmin) {
      subject = await subjectModel.findOne({ _id: subjectId, createdBy: hrAdmin._id });
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      subject = await subjectModel.findOne({ _id: subjectId, createdBy: { $in: instructor.hrAdmins } });
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: "Subject not found or you don't have permission to access it"
      });
    }

    // Find topics for this subject
    const topics = await topicModel.find({ subject: subjectId })
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Topics retrieved successfully",
      data: topics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Simple function to get lessons by topic ID (for Add Quiz dropdown)
exports.getLessonsByTopic = asyncHandler(async (req, res) => {
  try {
    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Topic ID is required"
      });
    }

    // Verify ownership for HR-Admin or Instructor (linked)
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    const topic = await topicModel.findById(topicId).populate('subject');
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    if (hrAdmin) {
      if (topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({ success: false, message: "Topic not found or you don't have permission to access it" });
      }
    } else if (req.user.userType === 'Instructor') {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !(instructor.hrAdmins || []).some(id => String(id) === String(topic.subject.createdBy))) {
        return res.status(403).json({ success: false, message: "Topic not found or you don't have permission to access it" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Topic not found or you don't have permission to access it" });
    }

    // Find lessons for this topic
    const lessons = await LessonsModel.find({ topic: topicId })
      .populate('topic', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lessons retrieved successfully",
      data: lessons
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

exports.getAlltopicsbysubject = asyncHandler(async (req, res) => {
  const { subject } = req.query;
  const { subjectId } = req.params;

  // Use subjectId from params if available, otherwise use subject from query
  const targetSubject = subjectId || subject;

  try {
    const findTopicLesson = await topicModel.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(targetSubject),
        },
      },
      {
        $lookup: {
          from: "lessons",
          let: { topicId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "lessons",
        },
      },
      // {
      //   $match:{
      //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
      //   }
      // },
      {
        $lookup: {
          from: "quizes",
          let: { topicId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $unwind: {
          path: "$quizes", // Specify the field you want to unwind
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "studentquizes",
          let: {
            topicId: { $toString: "$quizes._id" },
            stdId: { $toString: req.user?.profile?._id },
          }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
                    },
                    {
                      $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
                    },
                  ],
                },
              },
            },
          ],
          as: "studentquizes",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },

          image: { $first: "$image" },

          subject: { $first: "$subject" },
          difficulty: { $first: "$difficulty" },
          type: { $first: "$type" },
          lessons: { $first: "$lessons" },

          // Group by topic ID
          // subject: { $first: "$subject" }, // Keep other fields from the original topic
          // name: { $first: "$name" },
          quizes: {
            $push: {
              _id: "$quizes._id", // Keep quiz fields
              title: "$quizes.createdBy",
              questions: "$quizes.questions",
              status: "$quizes.status",
              topic: "$quizes.topic",
              subject: "$quizes.subject",
              image: "$quizes.image",
              type: "$quizes.type", // Include type field for private/universal check
              endsAt: "$quizes.endsAt",
              startsAt: "$quizes.startsAt",
              studentQuizData: "$studentquizes", // Embed the student quiz data
            },
          },
        },
      },
      {
        $sort: { name: 1 }, // Sort by name in ascending order (A to Z)
      },
    ]);
    // find({ subject });

    if (!findTopicLesson) {
      throw new Error("Topics not found");
    }

    res.status(200).json(
      new ApiResponse(
        200,
        await Promise.all(
          findTopicLesson.map(async (i) => {
            let c = 0;
            await Promise.all(i.lessons.map(async (j) => {
              const lessonDetails = await LessonsModel.findById(j._id);

              if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
                const employeeProgress = lessonDetails.userProgress.find(
                  progress => progress.user.toString() === req.user.profile._id.toString()
                );
                if (employeeProgress && employeeProgress.progress >= 100) {
                  c++;
                }
              }
            }));
            i.read = (c / i.lessons.length).toFixed(2)

            return i;
          })
        ),
        "lesson found sucessfully"
      )
    );
  } catch (error) {
    res.status(200).json({ mesage: error.message || "somthing went wrong" });
  }
});

exports.deletetopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the topic
    let data = await topicModel.findById(id);
    if (!data) {
      throw Error("Topic not found");
    }

    // Find ownership: HR-Admin or Instructor linked to HR-Admin that owns the subject
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        throw Error("HR-Admin record not found");
      }
      // We will validate by createdBy below against this set
      hrAdmin = null;
    }

    // Verify the topic belongs to the current HR-Admin
    const findsubject = await subjectModel.findById(data.subject);
    if (!findsubject) {
      throw Error("Subject not found for topic");
    }
    if (hrAdmin) {
      if (findsubject.createdBy.toString() !== hrAdmin._id.toString()) {
        throw Error("You don't have permission to delete this topic");
      }
    } else {
      const InstructorModel = require('../models/instructor');
      const instr = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instr || !(instr.hrAdmins || []).some(id => String(id) === String(findsubject.createdBy))) {
        throw Error("You don't have permission to delete this topic");
      }
    }

    // Delete all lessons associated with this topic
    await LessonsModel.deleteMany({ topic: id });

    // Remove the topic from the subject's topics array
    await subjectModel.findByIdAndUpdate(
      data.subject,
      { $pull: { topics: id } }
    );

    // Delete the topic
    await topicModel.findOneAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Topic and all associated lessons deleted successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.deletelesson = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the lesson
    let data = await LessonsModel.findById(id);
    if (!data) {
      throw Error("Lesson not found");
    }

    // Find ownership: HR-Admin or Instructor linked to HR-Admin
    let hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        throw Error("HR-Admin record not found");
      }
      hrAdmin = null;
    }

    // Verify the lesson belongs to the current HR-Admin
    const findtopic = await topicModel.findById(data.topic).populate('subject');
    if (!findtopic) {
      throw Error("Topic not found for lesson");
    }
    if (hrAdmin) {
      if (findtopic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        throw Error("You don't have permission to delete this lesson");
      }
    } else {
      const InstructorModel = require('../models/instructor');
      const instr = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instr || !(instr.hrAdmins || []).some(id => String(id) === String(findtopic.subject.createdBy))) {
        throw Error("You don't have permission to delete this lesson");
      }
    }

    // Remove the lesson from the topic's lessons array
    await topicModel.findByIdAndUpdate(
      data.topic,
      { $pull: { lessons: id } }
    );

    // Delete the lesson
    await LessonsModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.addlesson = asyncHandler(async (req, res) => {
  try {
    const { name, content, image, lang, topic, hrAdminIds, createForAll } = req.body;
    let computedWords = 0;
    let computedPages = 1;

    // Resolve acting HR-Admin (support Instructor)
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      const InstructorModel = require('../models/instructor');
      const instructor = await InstructorModel.findOne({ auth: req.user._id }, 'hrAdmins');
      if (!instructor || !instructor.hrAdmins || instructor.hrAdmins.length === 0) {
        return res.status(403).json({ success: false, message: 'Link to an HR-Admin is required to create lessons' });
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
        targetHrAdmins = (instructor?.hrAdmins || []).map(id => ({ _id: id }));
      }
    }

    const created = [];
    for (const admin of targetHrAdmins) {
      // Check if the topic exists and belongs to the current HR-Admin
      const findtopic = await topicModel.findOne({
        _id: topic,
        createdBy: admin._id
      }).populate('subject');

      if (!findtopic) {
        continue; // Skip if topic doesn't belong to this HR-Admin
      }

      // Check if the lesson already exists for the topic
      const alreadylesson = await LessonsModel.findOne({
        name: name.toLowerCase(),
        topic,
        createdBy: admin._id,
      });

      // If lesson already exists, skip
      if (alreadylesson) {
        continue;
      }

      // Detect content type and validate URL
      const { detectContentType, validateContentUrl } = require('../utils/contentTypeDetector');
      const contentType = detectContentType(content);
      const validation = validateContentUrl(content, contentType);

      if (!validation.isValid) {
        return res.status(200).json(new ApiResponse(400, validation.message));
      }

      // Use processed URL if available (e.g., YouTube embed URL)
      const processedContent = validation.processedUrl || content;

      // Compute words/pages dynamically based on content type
      try {
        const { isGoogleDocsUrl, computeGoogleDocStats } = require('../utils/googleDocsExtractor');
        if (typeof processedContent === 'string' && processedContent.length > 0) {
          if (contentType === 'google_docs' && isGoogleDocsUrl(processedContent)) {
            const stats = await computeGoogleDocStats(processedContent);
            if (stats) {
              computedPages = stats.pages;
              computedWords = stats.words;
            }
          } else if (contentType === 'youtube') {
            // For YouTube videos, estimate based on typical video length
            computedPages = 1; // Videos are typically considered as 1 "page"
            computedWords = 0; // No text content to count
          }
        }
      } catch (e) { }

      // Proceed to add the new lesson
      const data = await new LessonsModel({
        name: name.toLowerCase(),
        pages: computedPages,
        content: processedContent,
        contentType: contentType,
        image,
        lang,
        topic,
        createdBy: admin._id,
        words: computedWords,
      }).save();

      // Add the new lesson to the topic
      findtopic.lessons.push(data._id);
      await findtopic.save();

      // Populate the lesson with necessary fields for frontend
      const populatedLesson = await LessonsModel.findById(data._id)
        .populate('topic', 'name subject')
        .populate('createdBy', 'name email');

      created.push(populatedLesson);
    }

    // If creating for all HR-Admins, add to global lessons tracking
    if (createForAll && created.length > 0) {
      const SuperAdminControlsModel = require('../models/superAdminControls');
      const globalLessonIds = created.map(lesson => lesson._id);

      // Get or create SuperAdminControls document
      let superAdminControls = await SuperAdminControlsModel.findOne();
      if (!superAdminControls) {
        superAdminControls = new SuperAdminControlsModel({ globalLessons: globalLessonIds });
      } else {
        superAdminControls.globalLessons = [...new Set([...superAdminControls.globalLessons, ...globalLessonIds])];
      }
      await superAdminControls.save();
    }

    return res.status(200).json({
      success: true,
      data: created,
      message: `Lesson created for ${created.length} HR-Admin(s)`,
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(500).json(new ApiResponse(500, errorMessage));
  }
});


exports.updatelesson = asyncHandler(async (req, res) => {
  try {
    const findLesson = await LessonsModel.findById(req.params.id);
    if (!findLesson) {
      return res.status(200).json(new ApiResponse(404, "Lesson not found"));
    }

    const { name, content, image, lang, topic } = req.body;

    req.body = { name, content, image, lang, topic };
    for (let prop in req.body) {
      if (req.body[prop] === null || req.body[prop] === undefined) {
        delete req.body[prop];
      }
    }
    // Detect content type and validate URL if content is being updated
    if (req.body.content) {
      const { detectContentType, validateContentUrl } = require('../utils/contentTypeDetector');
      const contentType = detectContentType(req.body.content);
      const validation = validateContentUrl(req.body.content, contentType);

      if (!validation.isValid) {
        return res.status(200).json(new ApiResponse(400, validation.message));
      }

      // Use processed URL if available (e.g., YouTube embed URL)
      req.body.content = validation.processedUrl || req.body.content;
      req.body.contentType = contentType;
    }

    // Compute words/pages dynamically from content
    try {
      const { isGoogleDocsUrl, computeGoogleDocStats } = require('../utils/googleDocsExtractor');
      if (typeof req.body.content === 'string' && req.body.content.length > 0) {
        if (req.body.contentType === 'google_docs' && isGoogleDocsUrl(req.body.content)) {
          const stats = await computeGoogleDocStats(req.body.content);
          if (stats) {
            req.body.pages = stats.pages;
            req.body.words = stats.words;
          }
        } else if (req.body.contentType === 'youtube') {
          // For YouTube videos, estimate based on typical video length
          req.body.pages = 1; // Videos are typically considered as 1 "page"
          req.body.words = 0; // No text content to count
        }
      }
    } catch (e) { }
    const update = await LessonsModel.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: update,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(200).json(new ApiResponse(500, errorMessage));
  }
});
exports.getcontentOfLesson = asyncHandler(async (req, res) => {
  const LessonId = req.params.id;

  try {
    // For employees, verify they have access to this lesson
    if (req.user.userType === 'Employee') {
      const employeeId = req.user.profile._id;

      // Check if employee is linked to any HR-Admin
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not linked to any HR-Admin"
        });
      }

      // Get the lesson and verify it belongs to the employee's HR-Admin
      const lesson = await LessonsModel.findById(LessonId).populate({
        path: 'topic',
        populate: { path: 'subject' }
      });
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found"
        });
      }

      // Verify the lesson's topic's subject belongs to the employee's HR-Admin
      if (lesson.topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this lesson"
        });
      }

      // Verify the employee has this subject assigned
      const employee = await employeeModel.findById(employeeId);
      if (!employee || !employee.subjects || !employee.subjects.some(subjectId => subjectId.toString() === lesson.topic.subject._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this subject"
        });
      }
    }

    // Lesson completion is now tracked via userProgress field only
    // No need to update readby field
    const findLesson = await LessonsModel.findById(LessonId, { readyby: 0 });
    if (!findLesson) {
      return res.status(200).json(new ApiResponse(404, "Lesson not found"));
    }

    return res.status(200).json({
      message: "Content Found",
      data: findLesson,
      success: true,
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(200).json(new ApiResponse(500, errorMessage));
  }
});

exports.getAllLessonsOfTopics = asyncHandler(async (req, res) => {
  const topicId = req.params.id;
  try {
    // For employees, verify they are linked to an HR-Admin and have access to this topic
    if (req.user.userType === 'Employee') {
      const employeeId = req.user.profile._id;

      // Check if employee is linked to any HR-Admin
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No lessons available. You are not linked to any HR-Admin."
        });
      }

      // Get the topic and verify it belongs to the employee's HR-Admin
      const topic = await topicModel.findById(topicId).populate('subject');
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Topic not found"
        });
      }

      // Verify the topic's subject belongs to the employee's HR-Admin
      if (topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this topic"
        });
      }

      // Verify the employee has this subject assigned
      const employee = await employeeModel.findById(employeeId);
      if (!employee || !employee.subjects || !employee.subjects.some(subjectId => subjectId.toString() === topic.subject._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this subject"
        });
      }
    }

    const findTopicLesson = await LessonsModel.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
        },
      },
    ]);

    if (!findTopicLesson || findTopicLesson.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No lessons found for this topic"
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        await Promise.all(
          findTopicLesson.map(async (i) => {
            const lessonDetails = await LessonsModel.findById(i._id);

            if (lessonDetails && lessonDetails.userProgress && lessonDetails.userProgress.length > 0) {
              const employeeProgress = lessonDetails.userProgress.find(
                progress => progress.user.toString() === req.user.profile._id.toString()
              );
              if (employeeProgress && employeeProgress.progress >= 100) {
                i.status = "complete";
              } else {
                i.status = "incomplete";
              }
            } else {
              i.status = "incomplete";
            }
            return i;
          })
        ),
        "lesson found sucessfully"
      )
    );
  } catch (error) {
    res.status(200).json({ message: error.message || "something went wrong" });
  }
});

// Update lesson progress for an employee
exports.updateLessonProgress = asyncHandler(async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { progress, notes } = req.body;
    const employeeId = req.user.profile._id;

    // For employees, verify they have access to this lesson
    if (req.user.userType === 'Employee') {
      // Check if employee is linked to any HR-Admin
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not linked to any HR-Admin"
        });
      }

      // Get the lesson and verify it belongs to the employee's HR-Admin
      const lesson = await LessonsModel.findById(lessonId).populate({
        path: 'topic',
        populate: { path: 'subject' }
      });
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found"
        });
      }

      // Verify the lesson's topic's subject belongs to the employee's HR-Admin
      if (lesson.topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this lesson"
        });
      }

      // Verify the employee has this subject assigned
      const employee = await employeeModel.findById(employeeId);
      if (!employee || !employee.subjects || !employee.subjects.some(subjectId => subjectId.toString() === lesson.topic.subject._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this subject"
        });
      }
    } else {
      // For non-employees, just check if lesson exists
      const lesson = await LessonsModel.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found"
        });
      }
    }

    // Get the lesson for progress update (re-fetch if needed for employees)
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
      lesson.userProgress[userProgressIndex].progress = progress || lesson.userProgress[userProgressIndex].progress;
      lesson.userProgress[userProgressIndex].notes = notes !== undefined ? notes : lesson.userProgress[userProgressIndex].notes;
      lesson.userProgress[userProgressIndex].lastAccessed = new Date();
    } else {
      // Add new user progress
      lesson.userProgress.push({
        user: employeeId,
        progress: progress || 0,
        notes: notes || "",
        lastAccessed: new Date()
      });
    }

    const updatedLesson = await lesson.save();


    return res.status(200).json({
      success: true,
      message: "Lesson progress updated successfully",
      data: updatedLesson
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get lesson progress for an employee
exports.getLessonProgress = asyncHandler(async (req, res) => {
  try {
    const { lessonId } = req.params;
    const employeeId = req.user.profile._id;

    // For employees, verify they have access to this lesson
    if (req.user.userType === 'Employee') {
      // Check if employee is linked to any HR-Admin
      const hrAdmin = await hrAdminModel.findOne({ employees: employeeId });
      if (!hrAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not linked to any HR-Admin"
        });
      }

      // Get the lesson and verify it belongs to the employee's HR-Admin
      const lesson = await LessonsModel.findById(lessonId).populate({
        path: 'topic',
        populate: { path: 'subject' }
      });
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found"
        });
      }

      // Verify the lesson's topic's subject belongs to the employee's HR-Admin
      if (lesson.topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this lesson"
        });
      }

      // Verify the employee has this subject assigned
      const employee = await employeeModel.findById(employeeId);
      if (!employee || !employee.subjects || !employee.subjects.some(subjectId => subjectId.toString() === lesson.topic.subject._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this subject"
        });
      }
    } else {
      // For non-employees, just check if lesson exists
      const lesson = await LessonsModel.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found"
        });
      }
    }

    // Get the lesson for progress retrieval
    const lesson = await LessonsModel.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    const userProgress = lesson.userProgress.find(
      (up) => up.user.toString() === employeeId.toString()
    );

    const progressData = userProgress ? {
      progress: userProgress.progress,
      notes: userProgress.notes,
      lastAccessed: userProgress.lastAccessed
    } : {
      progress: 0,
      notes: "",
      lastAccessed: null
    };


    return res.status(200).json({
      success: true,
      message: "Lesson progress retrieved successfully",
      data: progressData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});
