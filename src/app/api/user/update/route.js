import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import nodemailer from "nodemailer";

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    
    const body = await request.json();
    const { name, fatherName, phone, school, classLevel, otp } = body;

    await connectDB();
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!otp) {
        return NextResponse.json({ message: "OTP is required to update profile" }, { status: 400 });
    }

    // OTP Verify karein
    const otpRecord = await Otp.findOne({ email: user.email, otp: otp });
    if (!otpRecord) {
        return NextResponse.json({ message: "Invalid or Expired OTP" }, { status: 400 });
    }
    
    // Purani details store karein mail ke liye
    const oldDetails = {
        name: user.name,
        fatherName: user.fatherName,
        phone: user.phone,
        school: user.school,
        classLevel: user.classLevel
    };

    // Database Update
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { name, fatherName, phone, school, classLevel },
      { new: true }
    ).select("-password");

    // OTP delete karein
    await Otp.deleteOne({ _id: otpRecord._id });

    // Nodemailer Setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Confirmation Email Body
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Profile Updated Successfully - LearnR",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #fbbf24; border-radius: 10px;">
          <h2 style="color: #fbbf24;">Profile Updated!</h2>
          <p>Hello <strong>${updatedUser.name}</strong>, your profile details have been updated successfully.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Field</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Updated Value</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${updatedUser.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Father's Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${updatedUser.fatherName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Phone</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${updatedUser.phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">School</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${updatedUser.school}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Class</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${updatedUser.classLevel}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't perform this action, please secure your account immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Profile updated and confirmation email sent!", user: updatedUser },
      { status: 200 }
    );

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}