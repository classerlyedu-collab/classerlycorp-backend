const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const hrAdminEmployeeRequestSchema = new Schema(
  {
    hrAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR-Admin",
    },
    status: {
      type: String,
      enum: ["Pending", "Complete", "Rejected"],
      default: "Pending",
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "subject",
    }],
  },
  {
    timestamps: true,
  }
);

const hrAdminEmployeeRequestModel = mongoose.models.hrAdminEmployeeRequest || mongoose.model(
  "hrAdminEmployeeRequest",
  hrAdminEmployeeRequestSchema
);
module.exports = hrAdminEmployeeRequestModel;
