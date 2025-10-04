const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subject",
      required: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true
    },
    userType: {
      type: String,
      enum: ["Admin", "HR-Admin", "Employee", "Supervisor", "Instructor"],
      required: true
    },
    // Reference to the other party in the conversation
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true
    },
    recipientType: {
      type: String,
      enum: ["Admin", "HR-Admin", "Employee", "Supervisor", "Instructor"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const commentModel = mongoose.model("Comment", commentSchema);
module.exports = commentModel; 