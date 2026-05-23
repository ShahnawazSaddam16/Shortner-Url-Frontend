const express = require("express");
const User = require("../Models/auth");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Url = require("../Models/Url");
const Plans = require("../Models/plans");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        success: true,
        message: "Account created successfully",
        token,
        user: {
          name: newUser.name,
          email: newUser.email,
        },
      });

  } catch (err) {
    console.log("Signup Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user: {
          name: user.name,
          email: user.email,
        },
      });

  } catch (err) {
    console.log("Login Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.log("Logout Error:", err);

    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

router.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    await Url.deleteMany({ createdBy: userId });

    await Plans.deleteMany({createdBy: userId });

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
      });
    }

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Account and all related data deleted successfully",
      user: {
        name: deletedUser.name,
        email: deletedUser.email,
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