const mongoose = require('mongoose');

const CallenderEventsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'auth',
        required: true
    },
    userType: {
        type: String,
        enum: ["Admin", "HR-Admin", "Employee", "Supervisor"],
        required: true
    },
    agenda: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CallenderEvents', CallenderEventsSchema); 