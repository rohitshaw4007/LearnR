import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Syllabus from "@/models/Syllabus";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // सिर्फ सिलेबस को Chapter No के हिसाब से सॉर्ट करके भेजें
    const syllabus = await Syllabus.find({ courseId: id }).sort({ chapterNo: 1 });
    return NextResponse.json(syllabus);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}