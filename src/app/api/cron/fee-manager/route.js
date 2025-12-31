// src/app/api/cron/fee-manager/route.js
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
    const enrollments = await Enrollment.find({ status: "approved" }).populate("user").populate("course");
    console.log(`[FEE_MANAGER_CRON] Found ${enrollments.length} active enrollments to check.`);

    let emailsSent = 0;
    let usersBlocked = 0;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const enrollment of enrollments) {
      if (!enrollment.nextPaymentDue) continue;

      const dueDate = new Date(enrollment.nextPaymentDue);
      dueDate.setHours(0, 0, 0, 0);

      // Diff calculate karo (Days mein)
      const diffTime = today - dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      // diffDays = 0 (Aaj due hai), Positive (Late hai), Negative (Abhi time hai)

      console.log(`[FEE_CHECK] User: ${enrollment.user.email} | Due: ${dueDate.toDateString()} | DiffDays: ${diffDays}`);

      // --- LOGIC 1: Reminder (2 Days Before) ---
      // diffDays should be -2
      if (diffDays === -2) {
         console.log(`[FEE_ACTION] Sending Pre-Due Reminder to ${enrollment.user.email}`);
         await sendEmail(transporter, enrollment.user.email, "Upcoming Fee Reminder", 
           `Hello ${enrollment.user.name}, your monthly fee for ${enrollment.course.title} is due on ${dueDate.toDateString()}. Please pay to ensure uninterrupted access.`);
         emailsSent++;
      }

      // --- LOGIC 2: Daily Reminder (On Due Date and After) ---
      // diffDays >= 0 (Matlab aaj due hai ya late ho gaya)
      // Lekin agar user BLOCK ho chuka hai, tab bhi bhej sakte hain "Please pay to unlock"
      if (diffDays >= 0) {
        
        // --- LOGIC 3: BLOCK USER (Grace Period Over) ---
        // Condition: User 1 month late hai (approx 30 days)
        if (diffDays > 30 && !enrollment.isBlocked) {
           console.log(`[FEE_ACTION] BLOCKING User ${enrollment.user.email} (Overdue > 30 days)`);
           enrollment.isBlocked = true;
           await enrollment.save();
           usersBlocked++;
           
           // Block hone ka mail
           await sendEmail(transporter, enrollment.user.email, "Access Revoked - Fee Overdue", 
             `ALERT: Your access to ${enrollment.course.title} has been BLOCKED because payment was not made within the grace period. Please pay immediately to unlock.`);
        } else {
           // Daily Reminder Logic
           // Ensure hum user ko minute-minute par spam na karein agar cron galti se multiple baar run ho jaye
           // Check lastEmailSentAt (Assume hum 20 hours ka gap rakhte hain)
           const lastMail = enrollment.lastEmailSentAt ? new Date(enrollment.lastEmailSentAt) : new Date(0);
           const hoursSinceLastMail = (new Date() - lastMail) / (1000 * 60 * 60);

           if (hoursSinceLastMail > 20) {
             console.log(`[FEE_ACTION] Sending Daily Payment Reminder to ${enrollment.user.email}`);
             
             let subject = diffDays === 0 ? "Fee Due Today!" : `Payment Overdue by ${diffDays} Days`;
             let body = `Hello ${enrollment.user.name}, your fee for ${enrollment.course.title} was due on ${dueDate.toDateString()}. 
                         ${diffDays > 0 ? "You are currently in the grace period." : "Please pay today."} 
                         If not paid within 30 days of due date, access will be blocked.`;
             
             await sendEmail(transporter, enrollment.user.email, subject, body);
             
             // Update timestamp
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

// Helper function for sending emails
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