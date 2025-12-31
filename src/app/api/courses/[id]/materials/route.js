import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Material from "@/models/Material";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Course ID

    // Fetch materials strictly for this course and populate syllabus details
    const materials = await Material.find({ courseId: id })
      .populate("syllabusId", "chapterName chapterNo")
      .sort({ createdAt: -1 });

    return NextResponse.json(materials);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}