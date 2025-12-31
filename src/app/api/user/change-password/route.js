import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; // Nodemailer import kiya

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    
    const body = await request.json();
    const { otp, newPassword } = body;

    if (!otp || !newPassword) {
        return NextResponse.json({ message: "OTP and New Password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // OTP Verify karein
    const otpRecord = await Otp.findOne({ email: user.email, otp: otp });
    if (!otpRecord) {
        return NextResponse.json({ message: "Invalid or Expired OTP" }, { status: 400 });
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Password in DB
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    // Used OTP ko delete karein
    await Otp.deleteOne({ _id: otpRecord._id });

    // --- Send Confirmation Email (New Logic) ---
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Security Alert: Password Changed - LearnR",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 10px;">
                <h2 style="color: #16a34a;">Password Changed Successfully</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>This is a confirmation that the password for your LearnR account has been changed successfully.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
                    <p style="margin: 0; color: #166534;">✅ Your account is secure.</p>
                </div>
                <p>If you did not perform this action, please <strong>reset your password immediately</strong> or contact support.</p>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated security message from LearnR.</p>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Password change ho gaya hai, bas email fail hua hai, isliye hum process stop nahi karenge
    }

    return NextResponse.json(
      { message: "Password changed successfully! 🔒", success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}