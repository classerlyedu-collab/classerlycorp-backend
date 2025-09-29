const { Router } = require('express');
// const { addsubjects, addTopic, allsubjects, alltopicsofsubject, allLessonsoftopics} = require('../controllers/CurriculumControllers/curriculum');
// const { AddTopics, getAllLessonsOfTopics, getcontentOfLesson } = require('./TopicsControllers/Topics.Controllers');
const { AddSubject, getAllSubjects, getAlltopicsofsubject, deleteSubject, updateSubject, getParticularStudentSubjects, syncGlobalSubjectsForAllHRAdmins, syncGlobalContentForAllHRAdmins } = require('../controllers/SubjectController');

const { verifyadmintoken, verifytoken, verifyteachertoken, verifyHRAdminSubscription } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloud = require('../config/cloudnaryconfig');




const router = Router();

// Get all subjects
router.route('/').get(verifytoken, getAllSubjects);

// Multer for backend-driven upload on AddSubject as well
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))
});
const upload = multer({ storage });



router.route('/').post(verifyteachertoken, verifyHRAdminSubscription, upload.single('file'), async (req, res, next) => {
    try {
        // If file provided, upload to cloudinary and set req.body.image
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            const result = await cloud.uploader.upload(filePath, { resource_type: 'image', folder: 'Classify Enterprises/subjects' });
            req.body.image = result.secure_url;
            fs.unlink(filePath, () => { });
        }
        return AddSubject(req, res, next);
    } catch (e) {
        return res.status(500).json({ success: false, message: e?.message || 'Upload failed' });
    }
});

router.route('/:id').delete(verifyteachertoken, verifyHRAdminSubscription, deleteSubject);
router.route('/:id').put(verifyteachertoken, verifyHRAdminSubscription, upload.single('file'), async (req, res, next) => {
    try {
        // If a new file is provided, upload to cloudinary and set req.body.image
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            const result = await cloud.uploader.upload(filePath, { resource_type: 'image', folder: 'Classify Enterprises/subjects' });
            req.body.image = result.secure_url;
            fs.unlink(filePath, () => { });
        }
        return updateSubject(req, res, next);
    } catch (e) {
        return res.status(500).json({ success: false, message: e?.message || 'Upload failed' });
    }
});

// Student subjects route
router.route('/student/:studentId/subjects').get(verifytoken, getParticularStudentSubjects);

// Sync global subjects for all HR-Admins (admin only)
router.route('/sync-global-subjects').post(verifyadmintoken, syncGlobalSubjectsForAllHRAdmins);

// Sync global content (topics, lessons, quizzes) for all HR-Admins (admin only)
router.route('/sync-global-content').post(verifyadmintoken, syncGlobalContentForAllHRAdmins);





// // Topics
// router.route('/add-topics/:id').post(AddTopics);
// router.route('/add-lessons/:id').post(AddLessons)
// router.route('/get-all-lessonsof-topic/:id').get(getAllLessonsOfTopics)
// router.route('/get-Lesson-Content/:id').get(getcontentOfLesson);
module.exports = router;