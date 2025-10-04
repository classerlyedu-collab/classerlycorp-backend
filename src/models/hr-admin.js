const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const hrAdminSchema = new Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
      }
    ],
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
      }
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const hrAdminModel = mongoose.models["HR-Admin"] || mongoose.model("HR-Admin", hrAdminSchema);
module.exports = hrAdminModel;
