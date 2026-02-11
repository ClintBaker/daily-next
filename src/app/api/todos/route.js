import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getLocalDayRange } from "@/lib/dateRange";
import { getUserId } from "@/lib/user";
import Todo from "@/models/Todo";

export async function GET(request) {
  try {
    await connectToDatabase();
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const points = searchParams.get("points");

    if (startDate && endDate && points) {
      const { start } = getLocalDayRange(startDate);
      const { end } = getLocalDayRange(endDate);
      const todos = await Todo.find({
        userId,
        completedAt: { $gte: start, $lte: end },
      }).lean();

      const total = todos.reduce((acc, todo) => acc + (todo.points || 0), 0);
      return NextResponse.json({ points: total });
    }

    if (startDate && endDate) {
      const { start } = getLocalDayRange(startDate);
      const { end } = getLocalDayRange(endDate);
      const todos = await Todo.find({
        userId,
        completedAt: { $gte: start, $lte: end },
      })
        .sort({ completedAt: 1 })
        .lean();

      return NextResponse.json(todos);
    }

    if (status) {
      const completedAtQuery = status === "incomplete" ? null : { $ne: null };
      const todos = await Todo.find({ userId, completedAt: completedAtQuery })
        .sort({ createdAt: 1 })
        .lean();

      return NextResponse.json(todos);
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: "Unable to fetch todos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const userId = getUserId(request);
    const body = await request.json();

    const todo = await Todo.create({
      ...body,
      userId,
      points: Number(body.points || 0),
      hyperlink: body.hyperlink || null,
      description: body.description || "",
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create todo" }, { status: 500 });
  }
}
