import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Result from "@/models/Result";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { testId } = await params;

        // 🛠️ FIX: Fetch top 10 results sorted by Score (High to Low) and Time (Low to High)
        const results = await Result.find({ testId })
            .populate('studentId', 'name email')
            .sort({ score: -1, timeTaken: 1 }) 
            .limit(10); 

        const leaderboard = results.map(r => ({
            studentId: r.studentId?._id || "Unknown",
            studentName: r.studentId?.name || "Unknown Student",
            score: r.score,
            timeTaken: r.timeTaken || 0
        }));

        return NextResponse.json({ success: true, leaderboard });
    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}