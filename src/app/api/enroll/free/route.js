import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";
import nodemailer from "nodemailer";
import { getDataFromToken } from "@/lib/getDataFromToken";

export async function POST(req) {
  try {
    await connectDB();
    const userId = await getDataFromToken(req);
    const { courseId } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const course = await Course.findById(courseId);
    if (!course || course.price !== 0) {
        return NextResponse.json({ error: "Course not found or not free" }, { status: 404 });
    }

    // --- FIX: HANDLE REJECTED STATUS ---
    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    
    if (existing) {
        // Agar status rejected hai, to purana delete karo aur aage badho
        if (existing.status === "rejected") {
            await Enrollment.findByIdAndDelete(existing._id);
        } else {
            // Agar pending ya approved hai, to rok do
            return NextResponse.json({ error: "Request already pending or enrolled" }, { status: 400 });
        }
    }
    // -----------------------------------

    const user = await User.findById(userId);
    const now = new Date();

    await Enrollment.create({
      user: userId,
      course: courseId,
      amount: 0,
      status: "pending",
      transactionId: `FREE_${Date.now()}`,
      subscriptionStart: now,
      paymentHistory: [{
          transactionId: "FREE_REQ",
          amount: 0,
          date: now,
          month: "One Time (Free)",
          status: "pending",
          method: "Free Request"
      }]
    });

    // Send Emails (Wrapped in try-catch)
    try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: "🔔 New Free Course Request",
          html: `<p>Student <strong>${user.name}</strong> requested for <strong>${course.title}</strong>.</p>`
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Request Received",
          html: `<p>Your request for <strong>${course.title}</strong> is pending approval.</p>`
        });
    } catch (e) { console.error("Email Error", e); }

    return NextResponse.json({ success: true, message: "Request Sent" });

  } catch (error) {
    console.error("Free Enroll Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}