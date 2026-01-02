import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";
import nodemailer from "nodemailer";

// Force dynamic ensures cron runs fresh every time
export const dynamic = "force-dynamic";

export async function GET(req) {
  console.log("[FEE_MANAGER_CRON] Cron Job Started...");
  
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight

    // Get all APPROVED enrollments
    const enrollments = await Enrollment.find({ status: "approved" })
      .populate("user")
      .populate("course");
      
    console.log(`[FEE_MANAGER_CRON] Found ${enrollments.length} active enrollments to check.`);

    let emailsSent = 0;
    let usersBlocked = 0;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const enrollment of enrollments) {
      // --- NEW LOGIC: SKIP FREE COURSES ---
      // Agar course ki price 0 hai, to fee check skip karo.
      if (enrollment.course && enrollment.course.price === 0) {
        continue;
      }
      // ------------------------------------

      if (!enrollment.nextPaymentDue) continue;

      const dueDate = new Date(enrollment.nextPaymentDue);
      dueDate.setHours(0, 0, 0, 0);

      // Diff calculate karo (Days mein)
      const diffTime = today - dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      console.log(`[FEE_CHECK] User: ${enrollment.user?.email} | Due: ${dueDate.toDateString()} | DiffDays: ${diffDays}`);

      // --- LOGIC 1: Reminder (2 Days Before) ---
      if (diffDays === -2) {
         await sendEmail(transporter, enrollment.user.email, "Upcoming Fee Reminder", 
           `Hello ${enrollment.user.name}, your monthly fee for ${enrollment.course.title} is due on ${dueDate.toDateString()}. Please pay to ensure uninterrupted access.`);
         emailsSent++;
      }

      // --- LOGIC 2: Daily Reminder & Blocking ---
      if (diffDays >= 0) {
        // Condition: User 1 month late hai (approx 30 days)
        if (diffDays > 30 && !enrollment.isBlocked) {
           console.log(`[FEE_ACTION] BLOCKING User ${enrollment.user.email}`);
           enrollment.isBlocked = true;
           await enrollment.save();
           usersBlocked++;
           
           await sendEmail(transporter, enrollment.user.email, "Access Revoked - Fee Overdue", 
             `ALERT: Your access to ${enrollment.course.title} has been BLOCKED because payment was not made within the grace period. Please pay immediately to unlock.`);
        } else {
           // Daily Reminder (Throttle: 20 hours gap)
           const lastMail = enrollment.lastEmailSentAt ? new Date(enrollment.lastEmailSentAt) : new Date(0);
           const hoursSinceLastMail = (new Date() - lastMail) / (1000 * 60 * 60);

           if (hoursSinceLastMail > 20) {
             let subject = diffDays === 0 ? "Fee Due Today!" : `Payment Overdue by ${diffDays} Days`;
             let body = `Hello ${enrollment.user.name}, your fee for ${enrollment.course.title} was due on ${dueDate.toDateString()}. 
                         ${diffDays > 0 ? "You are currently in the grace period." : "Please pay today."} 
                         If not paid within 30 days of due date, access will be blocked.`;
             
             await sendEmail(transporter, enrollment.user.email, subject, body);
             
             enrollment.lastEmailSentAt = new Date();
             await enrollment.save();
             emailsSent++;
           }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      report: { emailsSent, usersBlocked, totalChecked: enrollments.length } 
    });

  } catch (error) {
    console.error("[FEE_MANAGER_CRON] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendEmail(transporter, to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `<div style="font-family:sans-serif; padding:20px;"><h3>LearnR Notification</h3><p>${text}</p></div>`
    });
  } catch (e) {
    console.error(`[EMAIL_FAIL] Could not send to ${to}:`, e.message);
  }
}