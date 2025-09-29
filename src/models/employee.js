const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const employeeSchema = new Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth"
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
    ],
    code: {
      type: String,
      unique: true
    },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
    opinionEmail: {
      type: Boolean
    },
    reminderEmail: {
      type: Boolean
    },
    newEmail: {
      type: Boolean
    },
    reminder: {
      type: Boolean
    },
    quizReminder: {
      type: Boolean
    },
    gamesReminder: {
      type: Boolean
    },
  },
  {
    timestamps: true
  }
);

const employeeModel = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
module.exports = employeeModel;
