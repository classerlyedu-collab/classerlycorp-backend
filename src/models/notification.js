const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const NotificationSchema = new Schema(
  {
    forAll: { type: Boolean, default: false },
    forType: {
      type: String,
      enum: ["Employee", "HR-Admin", "Supervisor", "All"],
      required: function () {
        return !this.forAll;
      },
    },

    for: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return !this.forAll;
      },
    },
    title: {
      type: String,
    },
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;
