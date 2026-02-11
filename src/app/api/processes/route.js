import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserId } from "@/lib/user";
import Process from "@/models/Process";

export async function GET(request) {
  try {
    await connectToDatabase();
    const userId = getUserId(request);
    const processes = await Process.find({ userId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json(processes);
  } catch (error) {
    return NextResponse.json({ error: "Unable to fetch recurring items" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const userId = getUserId(request);
    const body = await request.json();

    const process = await Process.create({
      ...body,
      userId,
      points: Number(body.points || 0),
      cadence: Number(body.cadence || 1),
      hyperlink: body.hyperlink || null,
      description: body.description || "",
      lastComplete: body.lastComplete || new Date(),
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create recurring item" }, { status: 500 });
  }
}
