import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import nodemailer from "nodemailer"; // Nodemailer import karein

export async function POST(request) {
  try {
    const token = request.cookies.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Please login first", success: false },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid Token. Please login again.", success: false },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found", success: false },
        { status: 404 }
      );
    }

    // 1. 6-digit OTP Generate karein
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Database (Otp Model) mein save/update karein
    await Otp.findOneAndUpdate(
      { email: user.email },
      { otp: generatedOtp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 3. Nodemailer Transport Setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Email bhejne ka logic
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Profile Update OTP - LearnR",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #fbbf24;">LearnR Profile Update</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your OTP for updating your profile details is:</p>
          <h1 style="background: #f3f4f6; padding: 10px; text-align: center; letter-spacing: 5px; color: #333;">${generatedOtp}</h1>
          <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: "OTP sent to your email!", 
      success: true 
    }, { status: 200 });

  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please check email config.", success: false },
      { status: 500 }
    );
  }
}