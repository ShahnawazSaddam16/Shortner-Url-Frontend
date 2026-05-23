const mongoose = require("mongoose");

const plansSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    planStatus: {
        type: String,
        required: true
    },
    planCategory: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Plans", plansSchema);