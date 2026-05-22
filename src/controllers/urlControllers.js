const express = require("express");
const router = express.Router();
const Url = require("../Models/Url");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const rateLimit = require("express-rate-limit");

const generateQR = require("../utils/qrGenerator");
const malwareCheck = require("../middleware/malewareChecker");
const { authMiddleware } = require("../middleware/authMiddleware");
const auth = require("../Models/auth");

dotenv.config();

const shortUrlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

router.post("/shortner-url", authMiddleware, async (req, res) => {
  try {
    const userUrlCount = await Url.countDocuments({
      createdBy: req.user._id,
    });

    if (userUrlCount >= 20) {
      return res.status(403).json({
        success: false,
        message: "Free plan limit reached. Upgrade to create more URLs.",
      });
    }

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

    const existing = await Url.findOne({ shortCode });

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
      createdBy: req.user._id,
      email: req.user.email,
    });

    res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        ...newUrl.toObject(),
        shortUrl,
      },
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/user-urls", authMiddleware, async (req, res) => {
  try {
    const user_urls = await Url.find({
      email: req.user.email,
    }).sort({ createdAt: -1 });

    const formatted = user_urls.map((u) => ({
      _id: u._id,
      originalUrl: u.originalUrl,
      shortCode: u.shortCode,
      shortUrl: `${process.env.BASE_URL}/${u.shortCode}`,
      clicks: u.clicks,
      qrCode: u.qrCode,
      createdAt: u.createdAt,
    }));

    const totalShortUrls = formatted.length;
    const totalClicks = formatted.reduce((sum, item) => sum + item.clicks, 0);

    res.status(200).json({
      success: true,
      message: "Data Fetched Successfully",
      user_urls: formatted,
      totalShortUrls,
      totalClicks,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.get("/:code", shortUrlLimiter, async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.query;

    const url = await Url.findOne({ shortCode: code }).select("+password");

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

router.put("/updating-url/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, expiryDate, password, shortCode } = req.body;

    const existingUrl = await Url.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!existingUrl) {
      return res.status(404).json({
        success: false,
        message: "Url not found or unauthorized",
      });
    }

    if (originalUrl) {
      if (!validUrl.isUri(originalUrl)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Url",
        });
      }

      if (malwareCheck(originalUrl)) {
        return res.status(400).json({
          success: false,
          message: "Unsafe Url detected",
        });
      }

      existingUrl.originalUrl = originalUrl;
    }

    if (shortCode && shortCode !== existingUrl.shortCode) {
      const codeExists = await Url.findOne({ shortCode });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Short code already exists",
        });
      }

      existingUrl.shortCode = shortCode;
    }

    if (expiryDate) {
      existingUrl.expiresAt = expiryDate;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUrl.password = hashedPassword;
    }

    await existingUrl.save();

    res.status(200).json({
      success: true,
      message: "URL updated successfully",
      data: {
        _id: existingUrl._id,
        originalUrl: existingUrl.originalUrl,
        shortCode: existingUrl.shortCode,
        shortUrl: `${process.env.BASE_URL}/${existingUrl.shortCode}`,
        expiresAt: existingUrl.expiresAt,
        qrCode: existingUrl.qrCode,
        clicks: existingUrl.clicks,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/deleting-url/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUrl = await Url.findOneAndDelete({
      _id: id,
      createdBy: req.user._id,
    }).exec();

    if (deletedUrl === null || deletedUrl === undefined) {
      return res.status(404).json({
        success: false,
        message: "URL not found or you are not authorized to delete it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "URL deleted successfully",
      data: {
        _id: deletedUrl._id,
        shortCode: deletedUrl.shortCode,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;