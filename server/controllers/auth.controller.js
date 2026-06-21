const userService = require("../services/user.service");
const { User } = require("../models/user.model");
const {
  sendForgotPasswordOtpEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendUserRegistrationVerificationEmail,
} = require("../services/email.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const profileFields = [
  "mobile",
  "mobileNo",
  "employeeId",
  "gender",
  "dateOfBirth",
  "designation",
  "department",
  "address",
  "city",
  "state",
  "country",
  "postalCode",
  "area",
  "timezone",
  "skills",
  "bio",
  "availability",
  "profileImage",
  "photo",
];

const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  fullName: user.fullName || user.name,
  fullname: user.fullName || user.name,
  role: user.role,
  companyId: user.companyId,
  mobile: user.mobile,
  mobileNo: user.mobile,
  employeeId: user.employeeId,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
  designation: user.designation,
  department: user.department,
  address: user.address,
  city: user.city,
  state: user.state,
  country: user.country,
  postalCode: user.postalCode,
  area: user.area,
  timezone: user.timezone,
  skills: user.skills,
  bio: user.bio,
  availability: user.availability,
  profileImage: user.profileImage || user.photo,
  photo: user.photo || user.profileImage,
});

exports.register = async (req, res) => {
  try {
    // console.log(req.body)
    const { name, fullName, fullname, email, password, role } = req.body;
    const displayName = name || fullName || fullname;

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    // console.log(existingUser)
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await userService.createUser({
      name: displayName,
      fullName: fullName || fullname || displayName,
      email,
      password: hashedPassword,
      role,
      companyId: req.body.companyId,
      ...profileFields.reduce((profile, field) => {
        if (req.body[field] !== undefined) {
          profile[field] = req.body[field];
        }
        return profile;
      }, {}),
    });

    // Generate a JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      bearerToken: token,
      result: {
        user: buildUserResponse(newUser),
      },
    });

    sendUserRegistrationVerificationEmail({
      to: newUser.email,
      name: newUser.fullName || newUser.name,
      verificationUrl: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    }).catch((mailError) => console.log("Registration email failed:", mailError.message));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      status: "true",
      bearerToken: token,
      result: {
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Registered email is required" });
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const otp = String(crypto.randomInt(100000, 999999));
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl.replace(/\/$/, "")}/forgot-password?token=${rawToken}`;

    await sendForgotPasswordOtpEmail({
      to: user.email,
      name: user.fullName || user.name,
      otp,
      resetUrl,
    });

    res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to send password reset link" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Old password, new password, and confirm password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    sendPasswordChangedEmail({
      to: user.email,
      name: user.fullName || user.name,
    }).catch((mailError) => console.log("Password changed email failed:", mailError.message));

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to change password" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to reset password" });
  }
};

exports.logout = (req, res) => {
  // Invalidate the token (this is a simple implementation, you may want to use a token blacklist)
  res.json({ message: "User logged out" });
};

exports.me = (req, res) => {
  res.status(200).json({
    result: {
      user: buildUserResponse(req.user),
    },
  });
};
