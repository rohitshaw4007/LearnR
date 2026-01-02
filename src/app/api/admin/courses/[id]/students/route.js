import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment"; 
import nodemailer from "nodemailer";

// Cache disable
export const dynamic = 'force-dynamic';

// 1. Get Enrolled Students List - FIXED
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // FIX: Sirf unhi enrollments ko fetch karein jo 'approved' hain
    // Pehle ye saare status (pending, rejected) utha raha tha
    const enrollments = await Enrollment.find({ course: id, status: "approved" })
      .populate("user", "name email phone createdAt") 
      .lean();

    // Sirf valid users ko list mein filter karein
    const students = enrollments
      .map(enrollment => enrollment.user)
      .filter(user => user !== null);

    return NextResponse.json(students);
  } catch (error) {
    console.error("Fetch Students Error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// 2. Add Student (Manual Enroll)
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; 
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({ user: user._id, course: id });
    
    // Agar rejected hai to re-approve karein, nahi to error dein
    if (existingEnrollment && existingEnrollment.status === "approved") {
      return NextResponse.json({ error: "User is already enrolled" }, { status: 400 });
    }

    // 1. User model update (Legacy support)
    if (!user.courses.includes(id)) {
        user.courses.push(id);
        await user.save();
    }

    // 2. Course count badhayein
    const course = await Course.findByIdAndUpdate(
      id, 
      { $inc: { students: 1 } }, 
      { new: true }
    );

    // 3. Enrollment Record create ya update karein
    if (existingEnrollment) {
        existingEnrollment.status = "approved";
        existingEnrollment.amount = course.price || 0;
        existingEnrollment.paymentDate = new Date();
        await existingEnrollment.save();
    } else {
        await Enrollment.create({
            user: user._id,
            course: course._id,
            amount: course.price || 0,
            status: "approved",
            transactionId: `MANUAL_${Date.now()}`,
            paymentDate: new Date(),
        });
    }

    // 4. Welcome Email
    try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email, 
          subject: `🎉 Course Unlocked: ${course.title}`,
          html: `<p>Hi ${user.name}, Admin enrolled you in <strong>${course.title}</strong>.</p>`
        });
    } catch (e) { console.error("Email failed", e); }

    return NextResponse.json({ message: "Student enrolled successfully", student: user });

  } catch (error) {
    console.error("Manual Enroll Error:", error);
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }
}

// 3. Remove Student
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { studentId } = await req.json();

    if (!studentId) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

    const user = await User.findById(studentId);
    const course = await Course.findById(id);

    if (!user || !course) return NextResponse.json({ error: "User/Course not found" }, { status: 404 });

    // 1. User se remove
    await User.findByIdAndUpdate(studentId, { $pull: { courses: id } });
    
    // 2. Course count kam karein
    await Course.findByIdAndUpdate(id, { $inc: { students: -1 } });

    // 3. Enrollment delete karein
    await Enrollment.findOneAndDelete({ user: studentId, course: id });

    // 4. Email notification
    try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email, 
          subject: `Access Revoked: ${course.title}`,
          html: `<p>Your access to <strong>${course.title}</strong> has been removed.</p>`,
        });
    } catch (e) { console.error("Email failed", e); }

    return NextResponse.json({ message: "Student removed successfully" });
  } catch (error) {
    console.error("Remove Error:", error);
    return NextResponse.json({ error: "Failed to remove student" }, { status: 500 });
  }
}