import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  points: { type: Number, required: true },
  userId: { type: String, required: true, default: "local-user" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  hyperlink: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
});

const Todo = mongoose.models.Todo || mongoose.model("Todo", todoSchema);

export default Todo;
