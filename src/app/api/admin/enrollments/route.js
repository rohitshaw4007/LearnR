import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectDB();
    
    // Sirf 'pending' requests hi fetch karein
    const enrollments = await Enrollment.find({ status: "pending" })
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Fetch Enrollments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}