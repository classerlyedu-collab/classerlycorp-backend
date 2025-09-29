const mongoose = require("mongoose");
const { Schema } = require("mongoose");

// ######################## Subject Schema #####################
const subjectSchema = new Schema(
  {
    name: { type: String },
    image: String,

    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "HR-Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const subjectModel = mongoose.model("subject", subjectSchema);
module.exports = subjectModel;
