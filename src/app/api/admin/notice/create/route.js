// src/app/api/admin/notice/create/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User"; // Ensure User model is loaded
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    await connectDB();
    const { courseId, title, content, priority, durationHours } = await req.json();

    // 1. Expiry Time Calculate karein
    const expireAt = new Date();
    expireAt.setHours(expireAt.getHours() + parseInt(durationHours));

    // 2. Notice Save karein
    const newNotice = await Notice.create({
      course: courseId,
      title,
      content,
      priority,
      expireAt,
    });

    // 3. Course ke sabhi Students ke Emails fetch karein
    const enrollments = await Enrollment.find({ course: courseId, status: "approved" })
      .populate("user", "email name");

    const studentEmails = enrollments.map(enroll => enroll.user.email).filter(email => email);

    // 4. Agar students hain, to Email Bhejein
    if (studentEmails.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // HTML Email Template
      const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: studentEmails, // BCC use karein taki students ek dusre ka email na dekh sakein
        subject: `New Notice: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; border-left: 5px solid #facc15;">
              <h2 style="color: #333;">📢 New Notice Uploaded</h2>
              <p>Hello Student,</p>
              <p>A new notice has been posted in your classroom.</p>
              
              <div style="background: #fffbe6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top:0; color: #d97706;">${title}</h3>
                <p style="color: #555;">${content}</p>
                <p style="font-size: 12px; color: #888;">Expires in: ${durationHours} Hours</p>
              </div>

              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/classroom/${courseId}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Classroom</a>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true, message: "Notice added and emails sent!", notice: newNotice });
  } catch (error) {
    console.error("Notice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}