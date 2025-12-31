import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Material from "@/models/Material";
import Syllabus from "@/models/Syllabus";

// GET: Fetch all materials for a course (optionally filter by syllabusId)
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) return NextResponse.json({ error: "Course ID required" }, { status: 400 });

    const materials = await Material.find({ courseId }).populate("syllabusId", "chapterName chapterNo").sort({ createdAt: -1 });
    return NextResponse.json(materials);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add new material
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { courseId, syllabusId, title, type, fileUrl } = body;

    const newMaterial = await Material.create({
      courseId,
      syllabusId,
      title,
      type,
      fileUrl
    });

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}