const { Router } = require('express');
const { verifyadmintoken, verifytoken, verifyteachertoken, verifyHRAdminSubscription } = require('../middlewares/auth');
const { AddTopic, getAllTopics, getAlltopicsbysubject, deletetopic, updatetopic, getAllLessonsOfTopics, getcontentOfLesson, addlesson, updatelesson, deletelesson, getTopicsBySubject, getLessonsByTopic, updateLessonProgress, getLessonProgress, reorderTopics, reorderLessons } = require("../controllers/Topics.Controllers")
const router = Router();

// Reorder routes (must come before parameterized routes)
router.route('/reorder').put(verifyteachertoken, verifyHRAdminSubscription, reorderTopics);
router.route('/lesson/reorder').put(verifyteachertoken, verifyHRAdminSubscription, reorderLessons);

// HR-Admin routes (require subscription)
router.route('/').post(verifyteachertoken, verifyHRAdminSubscription, AddTopic);
router.route('/all').get(verifytoken, getAllTopics);
router.route('/').get(verifytoken, getAlltopicsbysubject);
router.route('/subject/:subjectId').get(verifytoken, getAlltopicsbysubject);
router.route('/simple/subject/:subjectId').get(verifytoken, getTopicsBySubject); // New simple route for Add Quiz
router.route('/:id').delete(verifyteachertoken, verifyHRAdminSubscription, deletetopic);
router.route('/:id').put(verifyteachertoken, verifyHRAdminSubscription, updatetopic);

// Lesson routes (HR-Admin routes - require subscription)
router.route('/lesson').post(verifyteachertoken, verifyHRAdminSubscription, addlesson)
router.route('/lesson/:id').put(verifyteachertoken, verifyHRAdminSubscription, updatelesson)
router.route('/lesson/:id').delete(verifyteachertoken, verifyHRAdminSubscription, deletelesson)

router.route('/lesson/:id').get(verifytoken, getAllLessonsOfTopics)
router.route('/lesson/simple/:topicId').get(verifytoken, getLessonsByTopic); // New simple route for Add Quiz
router.route('/lesson/content/:id').get(verifytoken, getcontentOfLesson)

// Lesson progress and notes endpoints
router.route('/lesson/progress/:lessonId').put(verifytoken, updateLessonProgress)
router.route('/lesson/progress/:lessonId').get(verifytoken, getLessonProgress)

module.exports = router;