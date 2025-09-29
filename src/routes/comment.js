const express = require("express");
const router = express.Router();
const Comment = require("../models/comment");
const { verifytoken } = require("../middlewares/auth");

// Get all comments between a specific teacher and student with pagination
router.get("/:teacherId/:studentId", verifytoken, async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const comments = await Comment.find({
      teacher: teacherId,
      student: studentId
    })
    .populate("teacher", "auth")
    .populate("student", "auth")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalComments = await Comment.countDocuments({
      teacher: teacherId,
      student: studentId
    });

    res.status(200).json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      totalComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new comment
router.post("/", verifytoken, async (req, res) => {
  try {
    const { teacherId, studentId, content, isTeacherComment } = req.body;

    const newComment = new Comment({
      teacher: teacherId,
      student: studentId,
      content,
      isTeacherComment: isTeacherComment !== undefined ? isTeacherComment : true
    });

    const savedComment = await newComment.save();
    const populatedComment = await Comment.findById(savedComment._id)
      .populate("teacher", "auth")
      .populate("student", "auth");

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 