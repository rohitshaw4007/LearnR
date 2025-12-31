import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import { getDataFromToken } from "@/lib/getDataFromToken";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    let userId = null;
    try { userId = await getDataFromToken(req); } catch (e) {}

    const tests = await Test.find({ 
      courseId: id, 
      status: { $ne: 'draft' } 
    }).sort({ scheduledAt: -1 });

    let attemptsMap = {};
    if (userId) {
        const results = await Result.find({ 
            studentId: userId, 
            testId: { $in: tests.map(t => t._id) } 
        });
        results.forEach(r => { attemptsMap[r.testId.toString()] = r; });
    }

    const processedTests = tests.map(test => {
        const attempt = attemptsMap[test._id.toString()];
        return {
            ...test._doc,
            isAttempted: !!attempt,
            resultId: attempt ? attempt._id : null,
            score: attempt ? attempt.score : null
        };
    });

    return NextResponse.json({ success: true, tests: processedTests });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}