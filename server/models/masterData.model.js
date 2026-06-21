const mongoose = require("mongoose");

const allowedTypes = [
  "project-category",
  "assignment-group",
  "designation",
  "department",
];

const masterDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: allowedTypes,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    parentType: {
      type: String,
      default: "",
      trim: true,
    },
    parentCode: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

masterDataSchema.index({ companyId: 1, type: 1, code: 1 }, { unique: true });

exports.MasterData = mongoose.model("MasterData", masterDataSchema);
exports.allowedMasterDataTypes = allowedTypes;
