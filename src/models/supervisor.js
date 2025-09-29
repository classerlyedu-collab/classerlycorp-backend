
const mongoose = require("mongoose");
const { Schema } = require("mongoose");


const supervisorSchema = new Schema(
  {

    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth"
    },

    employeeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
      }
    ],
    code: String

  },
  {
    timestamps: true,
  }
);

const supervisorModel = mongoose.models.Supervisor || mongoose.model("Supervisor", supervisorSchema);
module.exports = supervisorModel;
