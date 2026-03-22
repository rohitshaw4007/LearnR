import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import { getDataFromToken } from "@/lib/getDataFromToken";
import Enrollment from "@/models/Enrollment";
import Result from "@/models/Result";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Security: correctOption is hidden from frontend
    const test = await Test.findById(id).select("-questions.correctOption"); 
    if (!test) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // --- NEW: Time Logic with Validity Hours ---
    const now = new Date();
    const startTime = new Date(test.scheduledAt);
    
    // FIX: Validity Database se nikal rahe hain (Default 24 hours)
    const validityHours = test.validityHours || 24; 
    const validityMs = validityHours * 60 * 60 * 1000;
    const endTime = new Date(startTime.getTime() + validityMs);
    
    // ================= [ DEBUG LOGS ] =================
    console.log(`\n--- [START EXAM DEBUG] ---`);
    console.log(`Test ID: ${test._id}`);
    console.log(`Validity Set: ${validityHours} Hours`);
    console.log(`Start Time: ${startTime.toLocaleString()}`);
    console.log(`End Time (Expiry): ${endTime.toLocaleString()}`);
    console.log(`Current Time: ${now.toLocaleString()}`);
    console.log(`-----------------------------\n`);
    // ==================================================

    let statusUpdated = false;

    if (now >= startTime && now < endTime && test.status === 'scheduled') {
        test.status = 'live';
        statusUpdated = true;
        console.log(`[START EXAM DEBUG] Status changed to LIVE`);
    }
    if (now >= endTime && test.status !== 'completed') {
        test.status = 'completed';
        statusUpdated = true;
        console.log(`[START EXAM DEBUG] Status changed to COMPLETED (Validity Expired)`);
    }
    if (statusUpdated) await test.save();
    // ------------------------------------------

    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (test.status !== 'live') {
        const msg = test.status === 'completed' ? "Exam is no longer valid. The submission window has closed." : "Exam is not live yet.";
        console.log(`[START EXAM DEBUG] Blocked Access: ${msg}`);
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
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );

  } catch (error) {
    console.error(`[START EXAM ERROR]`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}