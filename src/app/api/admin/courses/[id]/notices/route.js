import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";

// Next.js caching disable karne ke liye (Taki notice turant dikhe)
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    
    // Next.js 13/14/15 compatibility fix: Params ko await karna behtar hai
    const resolvedParams = await params;
    const { id } = resolvedParams; // courseId

    if (!id) {
      return NextResponse.json({ success: false, error: "Course ID is missing" }, { status: 400 });
    }

    // 1. Course ID match karein
    // 2. Sirf wahi notices layein jinka 'expireAt' time abhi FUTURE me hai
    // (Isse expired notices UI se turant gayab ho jayenge, bhale hi DB delete hone me 1 min le)
    const notices = await Notice.find({ 
        course: id,
        expireAt: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    console.error("Fetch Notices Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}