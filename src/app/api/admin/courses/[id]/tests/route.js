import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    // Query setup
    const query = { courseId: id };
    if (type) query.type = type;

    // Fetch Tests
    let tests = await Test.find(query).sort({ scheduledAt: -1 });

    // ============================================================
    // 🛠️ ADMIN VIEW AUTO-UPDATER
    // ============================================================
    const now = new Date();
    let updatesMade = false;

    console.log(`🔍 [ADMIN CHECK] Checking ${tests.length} tests for time updates...`);

    const updatedTestsPromise = tests.map(async (test) => {
        const startTime = new Date(test.scheduledAt);
        const durationMs = (test.duration || 60) * 60 * 1000;
        const endTime = new Date(startTime.getTime() + durationMs);
        
        let needsSave = false;

        // Auto Start Logic
        if (test.status === 'scheduled' && now >= startTime && now < endTime) {
            test.status = 'live';
            needsSave = true;
            console.log(`🟢 [ADMIN AUTO] Started: ${test.title}`);
        }

        // Auto End Logic
        // 'live' हो या 'scheduled' (missed exam), अगर टाइम खत्म तो completed
        if ((test.status === 'live' || test.status === 'scheduled') && now >= endTime) {
            test.status = 'completed';
            needsSave = true;
            console.log(`🔴 [ADMIN AUTO] Ended: ${test.title}`);
        }

        if (needsSave) {
            await test.save();
            updatesMade = true;
        }
        return test;
    });

    // Wait for all updates to finish
    tests = await Promise.all(updatedTestsPromise);

    if (updatesMade) {
        console.log("✅ [ADMIN SYNC] Database statuses updated.");
    }
    // ============================================================

    return NextResponse.json(tests);
  } catch (error) {
    console.error("GET Tests Error:", error);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

// POST: Create Test (Standard)
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (!body.title || !body.scheduledDate || !body.scheduledTime) {
         return NextResponse.json({ error: "Details required" }, { status: 400 });
    }

    const scheduledAt = new Date(`${body.scheduledDate}T${body.scheduledTime}`);

    const newTest = await Test.create({
      ...body,
      courseId: id,
      scheduledAt: scheduledAt,
      questions: [],
      status: 'scheduled'
    });

    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}