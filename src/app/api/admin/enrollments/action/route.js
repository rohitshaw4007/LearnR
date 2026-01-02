import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // ======================================================
    // CASE 1: APPROVE/REJECT EXISTING REQUEST (From Dashboard)
    // ======================================================
    if (body.enrollmentId && body.action) {
        const { enrollmentId, action } = body;
        
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate("user")
            .populate("course");

        if (!enrollment) {
            return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        // --- ACTION: APPROVE ---
        if (action === "approve") {
            
            if (!enrollment.user || !enrollment.course) {
                return NextResponse.json({ 
                    error: "Linked User or Course not found. Cannot approve." 
                }, { status: 400 });
            }

            // 1. Enrollment Status Update
            enrollment.status = "approved";
            enrollment.isBlocked = false;
            if (enrollment.paymentHistory && enrollment.paymentHistory.length > 0) {
                enrollment.paymentHistory[0].status = "success";
            }
            await enrollment.save();

            // 2. User Update (Add Course ID to User's list)
            await User.findByIdAndUpdate(enrollment.user._id, {
                $addToSet: { courses: enrollment.course._id },
            });

            // 3. Course Update (FIXED: Increment Student Count by 1)
            // Error yahan tha, hum ID push kar rahe the jabki ye Number field hai
            await Course.findByIdAndUpdate(enrollment.course._id, {
                $inc: { students: 1 }, 
            });

            // 4. Send Email
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: enrollment.user.email,
                    subject: "🎉 Enrollment Approved - LearnR",
                    html: `
                        <h3>Congratulations!</h3>
                        <p>Hello ${enrollment.user.name},</p>
                        <p>Your enrollment for <strong>${enrollment.course.title}</strong> has been 
                        <span style="color: green; font-weight: bold;">APPROVED</span>.</p>
                        <p>You can now access your course from your dashboard.</p>
                    `
                });
            } catch (emailErr) {
                console.error("Email sending failed:", emailErr.message);
            }

            return NextResponse.json({ message: "Approved successfully" });

        // --- ACTION: REJECT ---
        } else if (action === "reject") {
            
            if (enrollment.user) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: enrollment.user.email,
                        subject: "Enrollment Request Update - LearnR",
                        html: `
                            <h3>Request Update</h3>
                            <p>Hello ${enrollment.user.name},</p>
                            <p>Your enrollment request for <strong>${enrollment.course?.title || 'Course'}</strong> has been 
                            <span style="color: red; font-weight: bold;">DECLINED</span>.</p>
                            <p>You can try enrolling again if you wish.</p>
                        `
                    });
                } catch (emailErr) {
                    console.error("Email sending failed:", emailErr.message);
                }
            }

            // Data Delete karein
            await Enrollment.findByIdAndDelete(enrollmentId);

            return NextResponse.json({ message: "Request Rejected and Data Deleted" });
        }
    }

    // ======================================================
    // CASE 2: MANUAL ENTRY (Admin adds student manually)
    // ======================================================
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ message: "User ID and Course ID are required" }, { status: 400 });
    }

    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (existingEnrollment) {
      return NextResponse.json({ message: "User is already enrolled in this course" }, { status: 400 });
    }

    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const newEnrollment = await Enrollment.create({
      user: userId, 
      course: courseId,
      enrolledAt: now,
      status: "approved", 
      amount: 0, 
      transactionId: "MANUAL_ADMIN_ENTRY",
      subscriptionStart: now,
      nextPaymentDue: nextDue, 
      isBlocked: false,
      paymentHistory: [{
          transactionId: "MANUAL_ADMIN_ENTRY",
          amount: 0,
          date: now,
          month: "Joining (Manual)",
          status: "success",
          method: "Manual Enrollment"
      }]
    });

    // Update User
    await User.findByIdAndUpdate(userId, { $addToSet: { courses: courseId } });
    
    // Update Course (FIXED HERE TOO)
    await Course.findByIdAndUpdate(courseId, { $inc: { students: 1 } });

    return NextResponse.json(
      { message: "Manual Enrollment successful", enrollment: newEnrollment },
      { status: 201 }
    );

  } catch (error) {
    console.error("Enrollment Action Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}