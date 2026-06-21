const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      trim: true,
      default: "tester",
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
    },
    skills: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    availability: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

exports.User = mongoose.model("User", userSchema);
