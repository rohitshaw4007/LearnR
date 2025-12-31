import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";

// Data hamesha fresh rahe
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams; // courseId

    if (!id) {
      return NextResponse.json({ success: false, error: "Course ID is missing" }, { status: 400 });
    }

    // Sirf Active Notices layein (Jo abhi Expire nahi huye hain)
    const notices = await Notice.find({ 
        course: id,
        expireAt: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}