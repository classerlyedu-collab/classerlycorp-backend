const cloud = require("../config/cloudnaryconfig");
const asyncHandler = require("../utils/asyncHandler");
const fs = require('fs');
const path = require('path');

exports.upload = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Image upload service is not configured. Please contact administrator."
    });
  }

  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, message: "File not found on server" });
    }

    // Determine resource type and folder based on file type
    const isVideo = req.file.mimetype.startsWith('video/');
    const folder = "Classify Enterprises/discussion";

    // Upload options with quality optimization
    const uploadOptions = {
      resource_type: "auto",
      folder: folder,
    };

    // Add quality optimization for images
    if (!isVideo) {
      uploadOptions.quality = "auto:low"; // Automatic quality reduction for images
      uploadOptions.fetch_format = "auto"; // Automatically choose best format (WebP, etc.)
    } else {
      // Video optimization - convert to web-friendly format
      uploadOptions.quality = "auto:low";
      uploadOptions.resource_type = "video";
      uploadOptions.format = "mp4"; // Convert to MP4 for universal browser support
      uploadOptions.video_codec = "h264"; // Use H.264 codec for best compatibility
      uploadOptions.audio_codec = "aac"; // AAC audio for best compatibility
    }

    // Upload to Cloudinary
    const result = await cloud.uploader.upload(filePath, uploadOptions);

    // Delete the local file after successful upload
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
      }
    });

    res.status(200).json({
      success: true,
      file: result.secure_url,
      public_id: result.public_id,
      filename: req.file.filename,
      uploadedAt: new Date(),
      resource_type: result.resource_type,
      format: result.format,
      // Return proper MIME type for videos converted to MP4
      mimeType: isVideo ? 'video/mp4' : req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Clean up local file if upload failed
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Upload failed"
    });
  }
});