const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },

    shortCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
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
      default: null,
    },

    password: {
      type: String,
      default: null,
      select: false,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    analytics: [
      {
        ip: {
          type: String,
        },

        country: {
          type: String,
        },

        city: {
          type: String,
        },

        device: {
          type: String,
        },

        clickedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Url", urlSchema);