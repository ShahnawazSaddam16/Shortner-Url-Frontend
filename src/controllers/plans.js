const express = require("express");
const router = express.Router();
const Plans = require("../Models/plans");
const { authMiddleware } = require("../middleware/authMiddleware");


router.post("/plan", authMiddleware, async (req, res) => {
    try {
        const { planStatus, planCategory } = req.body;

        if (!planStatus || !planCategory) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const plan = await Plans.findOneAndUpdate(
            { user: req.user._id, email: req.user.email },
            { planStatus, planCategory },
            { new: true, upsert: true } 
        );

        return res.status(200).json({
            success: true,
            message: "Plan saved successfully",
            data: plan
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});


router.put("/plan", authMiddleware, async (req, res) => {
    try {
        const { planStatus, planCategory } = req.body;

        if (!planStatus || !planCategory) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const plan = await Plans.findOneAndUpdate(
            { user: req.user._id, email: req.user.email },
            { planStatus, planCategory },
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Plan updated successfully",
            data: plan
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});


router.get("/plan", authMiddleware, async (req, res) => {
    try {
        const plan = await Plans.findOne({
            user: req.user._id,
            email: req.user.email
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Plan fetched successfully",
            data: plan
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;