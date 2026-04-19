import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import { getDataFromToken } from "@/lib/getDataFromToken";
import Enrollment from "@/models/Enrollment";
import Result from "@/models/Result";

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
    
    // FIX 1 & 2: isManualStart check aur Race-condition fix (update instead of direct save)
    if (now >= startTime && now < endTime && test.status === 'scheduled') {
        if (!test.isManualStart) { 
            await Test.updateOne({ _id: test._id, status: 'scheduled' }, { $set: { status: 'live' } });
            test.status = 'live';
        }
    } else if (now >= endTime && test.status !== 'completed') {
        await Test.updateOne({ _id: test._id, status: { $ne: 'completed' } }, { $set: { status: 'completed' } });
        test.status = 'completed';
    }

    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollment = await Enrollment.findOne({ course: test.courseId, user: userId, status: "approved" });
    if (!enrollment) return NextResponse.json({ error: "You are not enrolled." }, { status: 403 });

    // FIX 3: Prevent early manual start exploits
    if (test.status === 'live' && now < startTime && !test.isManualStart) {
        return NextResponse.json({ error: "Exam has not started yet according to schedule." }, { status: 403 });
    }

    if (test.status !== 'live') {
        const msg = test.status === 'completed' ? "Exam has ended." : "Exam is not live yet.";
        return NextResponse.json({ error: msg }, { status: 403 });
    }

    // FIX 4: Session Based Tracker for strict duration (Page reload bypass handle ho jayega)
    let existingResult = await Result.findOne({ testId: id, studentId: userId });
    
    if (existingResult) {
        if (existingResult.status === 'completed' || existingResult.status === 'auto-submitted') {
            return NextResponse.json({ error: "You have already submitted this exam." }, { status: 400 });
        }
        
        // Agar in-progress hai (student ne reload kiya tab)
        const startedTime = existingResult.startedAt.getTime();
        const allowedTimeMs = test.duration * 60 * 1000;
        if (Date.now() > startedTime + allowedTimeMs + (5 * 60 * 1000)) { // 5 min grace period
            return NextResponse.json({ error: "Your exam time has expired." }, { status: 403 });
        }
    } else {
        // First time start kar raha hai
        await Result.create({
            testId: id,
            studentId: userId,
            courseId: test.courseId,
            totalMarks: test.totalMarks,
            status: 'in-progress',
            startedAt: new Date()
        });
    }

    return NextResponse.json(
      { success: true, test },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}