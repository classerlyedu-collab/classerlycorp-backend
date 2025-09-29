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

    // Upload to Cloudinary
    const result = await cloud.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "Classify Enterprises/profile" // Optional: organize uploads in folders
    });

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
      uploadedAt: new Date()
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