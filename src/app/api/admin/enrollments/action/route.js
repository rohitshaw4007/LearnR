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
    // CASE 1: APPROVE/REJECT EXISTING REQUEST
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

            // 2. User Update
            await User.findByIdAndUpdate(enrollment.user._id, {
                $addToSet: { courses: enrollment.course._id },
            });

            // 3. Course Update
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

            // Data Delete
            await Enrollment.findByIdAndDelete(enrollmentId);

            return NextResponse.json({ message: "Request Rejected and Data Deleted" });
        }
    }

    // ======================================================
    // CASE 2: MANUAL ENTRY (With Date & Full Payment Fix)
    // ======================================================
    const { userId, courseId, joinDate, initialPaidAmount } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ message: "User ID and Course ID are required" }, { status: 400 });
    }

    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (existingEnrollment) {
      return NextResponse.json({ message: "User is already enrolled in this course" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    
    // --- 1. DATE FIX: Ensure correct parsing ---
    const now = new Date();
    // Use the provided joinDate (must be YYYY-MM-DD string) or default to now
    const startDate = joinDate ? new Date(joinDate) : now;

    // --- 2. PAYMENT FIX: Calculate Next Payment Due correctly ---
    let nextDue = new Date(startDate);
    
    if (!isNaN(startDate.getTime())) {
        // Loop until nextDue is in the future
        while (nextDue <= now) {
            nextDue.setMonth(nextDue.getMonth() + 1);
        }
    } else {
        // Fallback
        nextDue = new Date(now);
        nextDue.setMonth(nextDue.getMonth() + 1);
    }

    // --- 3. AMOUNT FIX: Use the Total Calculated Amount ---
    // If initialPaidAmount is sent (it should be), use it. otherwise fallback.
    let finalInitialAmount = 0;
    if (initialPaidAmount !== undefined && initialPaidAmount !== null) {
        finalInitialAmount = Number(initialPaidAmount);
    } else if (course && course.price > 0) {
        // Fallback calculation in backend
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        const multiplier = monthsDiff >= 0 ? monthsDiff + 1 : 1;
        finalInitialAmount = course.price * multiplier;
    }

    // Create Enrollment
    const newEnrollment = await Enrollment.create({
      user: userId, 
      course: courseId,
      
      // Explicitly setting dates
      enrolledAt: startDate,        
      subscriptionStart: startDate, 
      lastPaymentDate: startDate,   
      
      status: "approved", 
      amount: course.price || 0,    // Monthly recurring fee
      transactionId: "MANUAL_ADMIN_ENTRY",
      
      nextPaymentDue: nextDue,      // Future date
      isBlocked: false,
      
      // THIS IS THE KEY FIX FOR PAYMENT HISTORY
      paymentHistory: [{
          transactionId: "MANUAL_ADMIN_ENTRY",
          amount: finalInitialAmount, // Full Accumulated Amount
          date: startDate,            // Backdated payment date
          month: "Joining (Manual/Offline) - Accumulated",
          status: "success",
          method: "Manual Enrollment"
      }]
    });

    // --- 4. DATE OVERWRITE FIX (Force createdAt) ---
    // Mongoose creates with 'now', we must update it immediately
    await Enrollment.findByIdAndUpdate(
        newEnrollment._id,
        { 
            $set: { 
                createdAt: startDate, 
                updatedAt: startDate 
            } 
        },
        { timestamps: false } // Prevent auto-update to now
    );

    // Update User & Course
    await User.findByIdAndUpdate(userId, { $addToSet: { courses: courseId } });
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