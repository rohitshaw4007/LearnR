import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Syllabus from "@/models/Syllabus";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Fix: Added await
    
    const syllabus = await Syllabus.find({ courseId: id }).sort({ chapterNo: 1 });
    return NextResponse.json(syllabus);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Fix: Added await
    const body = await req.json();
    
    const newSyllabus = await Syllabus.create({ ...body, courseId: id });
    return NextResponse.json(newSyllabus);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}