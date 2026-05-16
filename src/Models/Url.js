const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },

    shortCode: {
      type: String,
      unique: true,
      required: true,
    },

    customCode: {
      type: Boolean,
      default: false,
    },

    clicks: {
      type: Number,
      default: 0,
    },

    qrCode: {
      type: String,
    },

    password: {
      type: String,
    },

    expiresAt: {
      type: Date,
    },

    analytics: [
      {
        ip: String,
        country: String,
        city: String,
        device: String,
        clickedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Url", urlSchema);