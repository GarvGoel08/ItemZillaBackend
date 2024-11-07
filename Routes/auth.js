const express = require("express");
const User = require("../Schemas/User");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const FetchUser = require("../middleware/FetchUser");
require("dotenv").config();

const JWT_SECRET = process.env.JTW_TOKEN;
const SALT_ROUNDS = 10;
const OTP_EXPIRATION_TIME = 5 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function deleteUsersWithExpiredOTP() {
  try {
    const currentTime = Date.now();
    await User.deleteMany({
      "otp.expirationTime": { $lte: currentTime },
      "otp.code": { $ne: null }, // Exclude users who have already verified OTP
    });
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 60 * 1000);

router.post(
  "/SignUp",
  [
    body("name", "Enter a Valid name with Minumum 3 chars").isLength({
      min: 3,
    }),
    body("pass", "Enter a Valid pass with Minumum 8 chars").isLength({
      min: 8,
    }),
    body("email", "Enter a Valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({ error: "JWT_SECRET is not defined" });
      }

      const otp = generateOTP();
      const hashedPassword = await bcrypt.hash(req.body.pass, SALT_ROUNDS);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        pass: hashedPassword,
        otp: {
          code: otp,
          expirationTime: Date.now() + OTP_EXPIRATION_TIME,
        },
      });

      if (await User.findOne({ email: req.body.email })) {
        return res
          .status(400)
          .json({ error: "Sorry, user with email already exists" });
      }

      await user.save();

      // Send OTP via email
      await sendOTPEmail(user.email, otp);
      return res.json({ success: "Waiting for OTP" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/GetSeller",  async (req, res) => {
  try {
    const userID = req.header('UserID');
    const user = await User.findById(userID);
    if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      else{
        res.json(user);
      }
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });}
});

router.get("/GetUser",FetchUser, async (req, res) => {
  try {
    const userID = req.user.id;
    const user = await User.findById(userID);
    if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      else{
        res.json(user);
      }
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });}
});

router.post(
  "/VerifyOTP",
  [body("otp", "Enter a valid OTP").isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      if (Date.now() > user.otp.expirationTime) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      if (req.body.otp !== user.otp.code) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      user.otp.code = null;
      user.otp.expirationTime = null;
      await user.save();

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);
      res.json({ authtoken });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/login",
  [
    body("pass", "Please enter a title").isLength({ min: 1 }),
    body("email", "Enter a Valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(400).json({ error: "Email does not Exist" });
      }

      if (user.otp.code !== null) {
        await User.deleteOne({ _id: user._id });
        return res
          .status(400)
          .json({
            error:
              "OTP verification pending, and OTP has expired. User deleted. Please Signup again",
          });
      }
      const isPasswordValid = await bcrypt.compare(req.body.pass, user.pass);
      if (isPasswordValid) {
        const data = {
          user: {
            id: user.id,
          },
        };
        const authtoken = jwt.sign(data, JWT_SECRET);
        res.json({ authtoken });
      } else {
        return res.status(400).json({ error: "Invalid Password" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for verification is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = router;
