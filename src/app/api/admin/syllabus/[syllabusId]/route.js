import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Syllabus from "@/models/Syllabus";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { syllabusId } = await params; // Fix: Added await
    const body = await req.json();

    // Agar status completed mark ho raha hai, toh date update karein
    if (body.status === "Completed" && !body.completedDate) {
        body.completedDate = new Date();
    } else if (body.status !== "Completed") {
        body.completedDate = null;
    }

    const updated = await Syllabus.findByIdAndUpdate(syllabusId, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { syllabusId } = await params; // Fix: Added await
    await Syllabus.findByIdAndDelete(syllabusId);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}