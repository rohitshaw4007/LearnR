import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lecture from "@/models/Lecture";

// PUT: Update Lecture
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Fix for Next.js 15
    const body = await req.json();

    const updatedLecture = await Lecture.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updatedLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lecture: updatedLecture });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove Lecture
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Fix for Next.js 15

    const deletedLecture = await Lecture.findByIdAndDelete(id);

    if (!deletedLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lecture deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}