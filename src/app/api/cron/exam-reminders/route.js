import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Result from "@/models/Result";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic'; // Ensure Next.js doesn't cache this

export async function GET(req) {
  try {
    await connectDB();
    console.log("⏰ Exam Reminder Cron Started...");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // --- Helper Function to Send Mail ---
    const sendBatchEmail = async (users, subject, message) => {
        const promises = users.map(user => {
            if(!user.email) return Promise.resolve();
            return transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #facc15;">LearnR Exam Alert</h2>
                    ${message}
                    <p style="margin-top: 20px;">All the best,<br>Team LearnR</p>
                  </div>
                `
            }).catch(err => console.error(`Failed to email ${user.email}:`, err.message));
        });
        await Promise.all(promises);
    };

    // --- CASE 1: 24 Hours Before (Exactly 1 day) ---
    // Logic: Find tests scheduled between 24h and 25h from now (assuming cron runs hourly)
    const next24hTests = await Test.find({
        scheduledAt: { 
            $gte: twentyFourHoursLater, 
            $lt: new Date(twentyFourHoursLater.getTime() + 60 * 60 * 1000) 
        }
    });

    for (const test of next24hTests) {
        const enrollments = await Enrollment.find({ course: test.courseId, status: "approved" }).populate("user");
        const students = enrollments.map(e => e.user);
        if(students.length > 0) {
            await sendBatchEmail(students, `Reminder: ${test.title} is tomorrow!`, `
                <p>Hello Student,</p>
                <p>Your exam <strong>${test.title}</strong> is scheduled for tomorrow at <strong>${new Date(test.scheduledAt).toLocaleString()}</strong>.</p>
                <p>Please be ready on time.</p>
            `);
            console.log(`✅ Sent 24h reminder for ${test.title} to ${students.length} students.`);
        }
    }

    // --- CASE 2: 1 Hour Before ---
    const next1hTests = await Test.find({
        scheduledAt: { 
            $gte: oneHourLater, 
            $lt: new Date(oneHourLater.getTime() + 60 * 60 * 1000) 
        }
    });

    for (const test of next1hTests) {
        const enrollments = await Enrollment.find({ course: test.courseId, status: "approved" }).populate("user");
        const students = enrollments.map(e => e.user);
        if(students.length > 0) {
            await sendBatchEmail(students, `Hurry! ${test.title} starts in 1 hour`, `
                <p>Hello Student,</p>
                <p>Your exam <strong>${test.title}</strong> is starting in approximately <strong>1 hour</strong>.</p>
                <p>Login to your portal and get ready.</p>
            `);
            console.log(`✅ Sent 1h reminder for ${test.title} to ${students.length} students.`);
        }
    }

    // --- CASE 3: LIVE EXAM REMINDER (Hourly for non-attempters) ---
    // Find tests that have started BUT not yet ended
    // Logic: scheduledAt < now  AND  scheduledAt + duration > now
    // Note: Since Mongo doesn't easily allow adding fields in query, we fetch live candidates via JS logic or basic query
    
    // Fetch tests that started in the last 12 hours (assuming max duration < 12h)
    const recentTests = await Test.find({
        scheduledAt: { $lt: now, $gt: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
    });

    for (const test of recentTests) {
        const endTime = new Date(new Date(test.scheduledAt).getTime() + test.duration * 60 * 1000);
        
        // Only if test is currently LIVE
        if (now < endTime) {
            // Get all enrolled students
            const enrollments = await Enrollment.find({ course: test.courseId, status: "approved" }).populate("user");
            
            // Get list of students who ALREADY submitted
            const submittedResults = await Result.find({ testId: test._id }).select("studentId");
            const submittedStudentIds = submittedResults.map(r => r.studentId.toString());

            // Filter: Enrolled Students - Submitted Students
            const pendingStudents = enrollments
                .map(e => e.user)
                .filter(user => !submittedStudentIds.includes(user._id.toString()));

            if (pendingStudents.length > 0) {
                await sendBatchEmail(pendingStudents, `⚠️ Action Required: ${test.title} is LIVE!`, `
                    <p>Hello Student,</p>
                    <p>The exam <strong>${test.title}</strong> is currently <strong>LIVE</strong> and you haven't attempted it yet.</p>
                    <p style="color: red; font-weight: bold;">Please start your exam immediately before time runs out!</p>
                `);
                console.log(`✅ Sent LIVE reminder for ${test.title} to ${pendingStudents.length} pending students.`);
            }
        }
    }

    return NextResponse.json({ success: true, message: "Cron executed successfully" });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}