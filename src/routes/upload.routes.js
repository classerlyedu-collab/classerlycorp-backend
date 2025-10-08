const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { upload } = require('../controllers/upload.controller');

// Define the maximum file size (10 MB for images, 50 MB for videos)
const maxSize = 50 * 1024 * 1024;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadsDir);
  },
  filename: function (req, file, callback) {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    callback(null, Date.now() + '-' + sanitizedName);
  },
});

// Define the upload handler with Multer options
const fileupload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize,
    files: 1 // Only allow one file at a time
  },
  fileFilter: function (req, file, callback) {
    // Check file type - allow images and videos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
    const extname = path.extname(file.originalname).toLowerCase();

    const isImage = allowedImageTypes.test(extname.replace('.', '')) && file.mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(extname.replace('.', '')) && file.mimetype.startsWith('video/');

    if (isImage || isVideo) {
      // Additional size check for images (5MB) and videos (50MB)
      if (isImage && file.size > 5 * 1024 * 1024) {
        return callback(new Error('Image files must be less than 5MB!'), false);
      }
      return callback(null, true);
    } else {
      callback(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) and video files (MP4, WEBM, OGG, MOV, AVI) are allowed!'), false);
    }
  },
});

const router = Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

router.post("/uploadimage", fileupload.single("file"), handleMulterError, upload);

module.exports = router;