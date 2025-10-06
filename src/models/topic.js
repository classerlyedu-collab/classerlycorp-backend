const mongoose = require("mongoose");
const { Schema } = require("mongoose");

// ######################## Topic Schema #####################
const TopicSchema = new Schema(
  {
    name: { type: String, unique: true },
    image: String,
    order: { type: Number, default: 0 },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subject",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR-Admin",
      required: true,
    },
    difficulty: {
      enum: ["Beginner", "Medium", "Advanced"],
      type: String,
      default: "Beginner"
    },
    type: { type: String, enum: ["Standard", "Premium"], default: "Standard" },
    lessonHours: {
      type: String,
    },
    practiceHours: {
      type: String,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lessons",
      },
    ],
    quizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    practices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Practice",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const topicModel = mongoose.model("Topic", TopicSchema);
module.exports = topicModel;
