import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import { getDataFromToken } from "@/lib/getDataFromToken";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const userId = await getDataFromToken(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const enrollment = await Enrollment.findOne({ course: id, user: userId });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (!enrollment.isBlocked) {
      return NextResponse.json({ error: "You are not blocked." }, { status: 400 });
    }

    // Update Request Status
    enrollment.unblockRequest = {
      status: "pending",
      requestedAt: new Date()
    };

    await enrollment.save();

    return NextResponse.json({ success: true, message: "Unblock request sent to Admin." });

  } catch (error) {
    console.error("Unblock Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}