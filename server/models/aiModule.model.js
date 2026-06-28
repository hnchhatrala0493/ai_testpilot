const mongoose = require("mongoose");

const aiModuleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    navLabel: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "AI Center",
    },
    route: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "Bot",
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Draft"],
      default: "Active",
    },
    permissions: [
      {
        type: String,
      },
    ],
    metrics: [
      {
        label: String,
        value: String,
        tone: String,
      },
    ],
    capabilities: [
      {
        title: String,
        description: String,
      },
    ],
    fields: [
      {
        name: String,
        label: String,
        type: {
          type: String,
          default: "text",
        },
        placeholder: String,
        required: Boolean,
      },
    ],
    actions: [
      {
        key: String,
        label: String,
        endpoint: String,
        method: {
          type: String,
          default: "POST",
        },
      },
    ],
    pipeline: [
      {
        type: String,
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

aiModuleSchema.index({ companyId: 1, slug: 1 }, { unique: true });

exports.AIModule = mongoose.model("AIModule", aiModuleSchema);
