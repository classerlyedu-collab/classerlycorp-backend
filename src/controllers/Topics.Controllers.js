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
    // Find the HR-Admin record using the auth user's ID
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      throw new Error("HR-Admin record not found");
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
      // fallback: current HR-Admin
      targetHrAdmins = [hrAdmin];
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
      created.push(newTopic);
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
    // Find the HR-Admin record using the auth user's ID
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      return res.status(404).json({
        success: false,
        message: "HR-Admin record not found"
      });
    }

    // Get all subjects created by this HR-Admin
    const hrAdminSubjects = await subjectModel.find({ createdBy: hrAdmin._id }).select('_id');
    const subjectIds = hrAdminSubjects.map(subject => subject._id);

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

    // Find the HR-Admin record using the auth user's ID
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      return res.status(404).json({
        success: false,
        message: "HR-Admin record not found"
      });
    }

    // Verify the subject belongs to the current HR-Admin
    const subject = await subjectModel.findOne({
      _id: subjectId,
      createdBy: hrAdmin._id
    });

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

    // Find the HR-Admin record using the auth user's ID
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      return res.status(404).json({
        success: false,
        message: "HR-Admin record not found"
      });
    }

    // Verify the topic belongs to the current HR-Admin
    const topic = await topicModel.findById(topicId).populate('subject');
    if (!topic || topic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Topic not found or you don't have permission to access it"
      });
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

    // Find the HR-Admin record to verify ownership
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      throw Error("HR-Admin record not found");
    }

    // Verify the topic belongs to the current HR-Admin
    const findsubject = await subjectModel.findById(data.subject);
    if (!findsubject || findsubject.createdBy.toString() !== hrAdmin._id.toString()) {
      throw Error("You don't have permission to delete this topic");
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

    // Find the HR-Admin record to verify ownership
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      throw Error("HR-Admin record not found");
    }

    // Verify the lesson belongs to the current HR-Admin
    const findtopic = await topicModel.findById(data.topic).populate('subject');
    if (!findtopic || findtopic.subject.createdBy.toString() !== hrAdmin._id.toString()) {
      throw Error("You don't have permission to delete this lesson");
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

    // Find the HR-Admin record using the auth user's ID
    const hrAdmin = await hrAdminModel.findOne({ auth: req.user._id });
    if (!hrAdmin) {
      throw new Error("HR-Admin record not found");
    }

    let targetHrAdmins = [];
    if (createForAll) {
      targetHrAdmins = await hrAdminModel.find({}, '_id');
    } else if (Array.isArray(hrAdminIds) && hrAdminIds.length > 0) {
      targetHrAdmins = await hrAdminModel.find({ _id: { $in: hrAdminIds } }, '_id');
    } else {
      // fallback: current HR-Admin
      targetHrAdmins = [hrAdmin];
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

      // Compute words/pages dynamically (Google Docs URL preferred)
      try {
        const { isGoogleDocsUrl, computeGoogleDocStats } = require('../utils/googleDocsExtractor');
        if (typeof content === 'string' && content.length > 0) {
          if (isGoogleDocsUrl(content)) {
            const stats = await computeGoogleDocStats(content);
            if (stats) {
              computedPages = stats.pages;
              computedWords = stats.words;
            }
          } else {
            const cleaned = content.replace(/\s+/g, ' ').trim();
            computedWords = cleaned.length === 0 ? 0 : cleaned.split(' ').filter(Boolean).length;
            const wordsPerPage = 300;
            computedPages = Math.max(1, Math.ceil(computedWords / wordsPerPage));
          }
        }
      } catch (e) { }

      // Proceed to add the new lesson
      const data = await new LessonsModel({
        name: name.toLowerCase(),
        pages: computedPages,
        content,
        image,
        lang,
        topic,
        createdBy: admin._id,
        words: computedWords,
      }).save();

      // Add the new lesson to the topic
      findtopic.lessons.push(data._id);
      await findtopic.save();
      created.push(data);
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
    // Compute words/pages dynamically from content
    try {
      const { isGoogleDocsUrl, computeGoogleDocStats } = require('../utils/googleDocsExtractor');
      if (typeof req.body.content === 'string' && req.body.content.length > 0) {
        if (isGoogleDocsUrl(req.body.content)) {
          const stats = await computeGoogleDocStats(req.body.content);
          if (stats) {
            req.body.pages = stats.pages;
            req.body.words = stats.words;
          }
        } else {
          const cleaned = req.body.content.replace(/\s+/g, ' ').trim();
          const words = cleaned.length === 0 ? 0 : cleaned.split(' ').filter(Boolean).length;
          const wordsPerPage = 300;
          req.body.pages = Math.max(1, Math.ceil(words / wordsPerPage));
          req.body.words = words;
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
    const findTopicLesson = await LessonsModel.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
        },
      },
    ]);

    // .populate({ path: "lessons", select: "_id name image" });

    if (!findTopicLesson) {
      throw new Error("Topic not found");
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
    res.status(200).json({ mesage: error.message || "somthing went wrong" });
  }
});

// Update lesson progress for an employee
exports.updateLessonProgress = asyncHandler(async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { progress, notes } = req.body;
    const employeeId = req.user.profile._id;


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
