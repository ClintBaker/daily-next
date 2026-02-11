import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserId } from "@/lib/user";
import Process from "@/models/Process";

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = getUserId(request);
    const updates = await request.json();

    const process = await Process.findOne({ _id: id, userId });
    if (!process) {
      return NextResponse.json({ error: "Recurring item not found" }, { status: 404 });
    }

    const allowedFields = [
      "name",
      "description",
      "cadence",
      "points",
      "lastComplete",
      "hyperlink",
    ];

    allowedFields.forEach((field) => {
      if (!(field in updates)) return;

      if (field === "cadence" || field === "points") {
        process[field] = Number(updates[field]);
        return;
      }

      if (field === "hyperlink") {
        process[field] = updates[field] ? String(updates[field]).trim() : null;
        return;
      }

      process[field] = updates[field];
    });

    await process.save();

    return NextResponse.json(process);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update recurring item", detail: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = getUserId(request);

    const deletedProcess = await Process.findOneAndDelete({ _id: id, userId });
    if (!deletedProcess) {
      return NextResponse.json({ error: "Recurring item not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Recurring item successfully deleted",
      process: deletedProcess,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete recurring item" }, { status: 500 });
  }
}
