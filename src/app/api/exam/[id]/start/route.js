import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import { getDataFromToken } from "@/lib/getDataFromToken";
import Enrollment from "@/models/Enrollment";
import Result from "@/models/Result";

// 🚨 STRICT NO-CACHE DIRECTIVES 🚨
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const test = await Test.findById(id).select("-questions.correctOption"); 
    if (!test) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const now = new Date();
    const startTime = new Date(test.scheduledAt);
    
    const validityHours = test.validityHours || 24; 
    const validityMs = validityHours * 60 * 60 * 1000;
    const endTime = new Date(startTime.getTime() + validityMs);
    
    let statusUpdated = false;

    if (now >= startTime && now < endTime && test.status === 'scheduled') {
        test.status = 'live';
        statusUpdated = true;
    }
    if (now >= endTime && test.status !== 'completed') {
        test.status = 'completed';
        statusUpdated = true;
    }
    if (statusUpdated) await test.save();

    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (test.status !== 'live') {
        const msg = test.status === 'completed' ? "Exam has ended." : "Exam is not live yet.";
        return NextResponse.json({ error: msg }, { status: 403 });
    }

    const enrollment = await Enrollment.findOne({ course: test.courseId, user: userId, status: "approved" });
    if (!enrollment) return NextResponse.json({ error: "You are not enrolled." }, { status: 403 });

    const existingResult = await Result.findOne({ testId: id, studentId: userId });
    if (existingResult) {
        return NextResponse.json({ error: "You have already submitted this exam." }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, test },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}