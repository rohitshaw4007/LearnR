import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lecture from "@/models/Lecture";

// GET: Fetch all lectures
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    // Sort by Chapter first, then createdAt
    const lectures = await Lecture.find({ courseId }).sort({ chapter: 1, createdAt: 1 });
    return NextResponse.json({ lectures });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new lecture
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Validate required fields
    if (!body.chapter) {
        return NextResponse.json({ error: "Chapter is required" }, { status: 400 });
    }

    const lecture = await Lecture.create(body);
    return NextResponse.json({ success: true, lecture });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}