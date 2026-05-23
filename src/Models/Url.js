const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true, trim: true },

    shortCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },

    customCode: { type: Boolean, default: false },

    clicks: { type: Number, default: 0 },

    qrCode: { type: String, default: null },

    password: { type: String, default: null, select: false },

    expiresAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: { type: String, required: true, lowercase: true, trim: true },

    analytics: [
      {
        ip: String,
        country: String,
        city: String,
        device: String,
        clickedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

urlSchema.index({ email: 1 });
urlSchema.index({ createdBy: 1 });
urlSchema.index({ expiresAt: 1 });
urlSchema.index({ clicks: -1 });
urlSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Url", urlSchema);