import mongoose from "mongoose";

const processSchema = new mongoose.Schema({
  name: { type: String, required: true },
  points: { type: Number, required: true },
  userId: { type: String, required: true, default: "local-user" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastComplete: {
    type: Date,
    default: Date.now,
  },
  cadence: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    default: "",
  },
  hyperlink: {
    type: String,
    default: null,
  },
});

const Process = mongoose.models.Process || mongoose.model("Process", processSchema);

export default Process;
