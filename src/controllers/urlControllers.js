const express = require("express");
const router = express.Router();
const Url = require("../Models/Url");
const dotenv = require("dotenv");

const generateQR = require("../utils/qrGenerator");
const malwareCheck = require("../middleware/malewareChecker");

const validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");

dotenv.config();

router.post("/shortner-url", async (req, res) => {
  try {
    const { originalUrl, customCode, expiryDate, password } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: "Original URL is required",
      });
    }

    if (!validUrl.isUri(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    if (malwareCheck(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "Unsafe URL detected",
      });
    }

    let shortCode = customCode || nanoid(6);

    const existing = await Url.findOne({
      shortCode,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Short code already exists",
      });
    }

    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    const qrCode = await generateQR(shortUrl);

    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUrl = await Url.create({
      originalUrl,
      shortCode,
      customCode: !!customCode,
      expiresAt: expiryDate || null,
      password: hashedPassword,
      qrCode,
    });

    res.status(201).json({
      success: true,
      shortUrl,
      data: newUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.query;

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Link expired",
      });
    }

    if (url.password) {
      if (!password) {
        return res.status(401).send(`
            <script>
                const pass = prompt("Enter password:");
                if (pass) {
                    window.location.href = window.location.href + "?password=" + encodeURIComponent(pass);
                }
            </script>
        `);
      }

      const isMatch = await bcrypt.compare(password, url.password);

      if (!isMatch) {
        return res.status(401).send("Invalid Password");
      }
    }

    url.clicks += 1;
    url.analytics.push({
      ip: req.ip,
      device: req.headers["user-agent"],
      clickedAt: new Date(),
    });

    await url.save();

    return res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
