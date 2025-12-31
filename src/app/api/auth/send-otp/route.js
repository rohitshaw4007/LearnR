import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    // 1. Check agar user pehle se exist karta hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered. Please Login." }, { status: 400 });
    }

    // 2. 6 Digit OTP Generate karein
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Purana OTP delete karein aur naya save karein
    await Otp.deleteMany({ email });

    // FIX: Yahan 'code: otpCode' ki jagah 'otp: otpCode' hona chahiye kyunki Schema mein field ka naam 'otp' hai
    await Otp.create({ 
        email: email, 
        otp: otpCode 
    });

    // 4. Email Bhejein
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for LearnR SignUp",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #facc15;">LearnR Verification</h2>
          <p>Your OTP for account registration is:</p>
          <h1 style="letter-spacing: 5px; color: #333;">${otpCode}</h1>
          <p>This code <strong>expires in 5 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "OTP Sent successfully to your email!" });
  } catch (error) {
    console.error("OTP Sending Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}