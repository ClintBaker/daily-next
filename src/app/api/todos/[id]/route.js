import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserId } from "@/lib/user";
import Todo from "@/models/Todo";

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = getUserId(request);
    const updates = await request.json();

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    Object.keys(updates).forEach((key) => {
      todo[key] = updates[key];
    });
    await todo.save();

    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update todo" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = getUserId(request);

    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!deletedTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Todo successfully deleted", todo: deletedTodo });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete todo" }, { status: 500 });
  }
}
