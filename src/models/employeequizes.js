const mongoose = require("mongoose");

const employeeQuizesSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quizes",
    },

    status: {
      type: String,
      enum: ["start", "complete", "result"],
      default: "start",
    },
    result: {
      type: String,
      enum: ["awaiting", "pass", "fail"],
      default: "awaiting",
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions",
      },
    ],
    answers: [{ type: String }],
    score: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },

  },
  {
    timestamps: true,
  }
);

const EmployeeQuizesModel = mongoose.models.employeeQuizes || mongoose.model("employeeQuizes", employeeQuizesSchema);
module.exports = EmployeeQuizesModel;
