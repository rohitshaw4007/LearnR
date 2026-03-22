import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Result from "@/models/Result";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { testId } = await params;

        // 🛠️ FIX: Tie-breaker Logic Added & Removed limit so everyone is visible
        const results = await Result.find({ testId })
            .populate('studentId', 'name email')
            .sort({ score: -1, timeTaken: 1 }); 

        const leaderboard = results.map(r => ({
            studentId: r.studentId?._id || "Unknown",
            studentName: r.studentId?.name || "Unknown Student",
            email: r.studentId?.email || "", 
            score: r.score,
            timeTaken: r.timeTaken || 0,
            submittedAt: r.createdAt
        }));

        return NextResponse.json({ success: true, leaderboard });
    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}