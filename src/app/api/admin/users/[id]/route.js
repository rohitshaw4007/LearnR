import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course"; 
import Enrollment from "@/models/Enrollment"; // Enrollment model added
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs"; // bcrypt added for password hashing

export const dynamic = 'force-dynamic';

// GET User Details
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
    }

    // 1. User Fetch karein
    let user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 2. Enrollments Fetch karein (Database se sahi data lane ke liye)
    // Hum seedha Enrollment collection check karenge taaki data accurate ho
    const enrollments = await Enrollment.find({ user: user._id })
      .populate({
        path: "course",
        select: "title description price level category thumbnail", // Zaroori fields select karein
      })
      .lean();

    // 3. User object me courses attach karein
    // Sirf wahi courses rakhenge jo exist karte hain (deleted courses filter out)
    user.courses = enrollments
      .map(enrollment => enrollment.course)
      .filter(course => course !== null);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Single User API Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// UPDATE User Details & Password
export async function PUT(request, { params }) {
    try {
      await connectDB();
      const { id } = await params;
      const body = await request.json();
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
      }
  
      const user = await User.findById(id);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
  
      const changes = [];
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { 
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS 
        },
      });

      // --- 1. Password Change Logic (Admin Override) ---
      if (body.newPassword) {
        // Hash new password
        const hashedPassword = await bcrypt.hash(body.newPassword, 10);
        user.password = hashedPassword;
        
        // Save immediately
        await user.save();

        // Send Password Change Email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Security Alert: Password Changed by Admin - LearnR",
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #dc2626; border-radius: 10px;">
                    <h2 style="color: #dc2626;">Password Reset Notice</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Your account password has been reset by the administration.</p>
                    <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                        <p style="margin: 0; color: #991b1b;">If you did not request this change, please contact support immediately.</p>
                    </div>
                    <p>You can now login with your new credentials.</p>
                  </div>
                `,
            });
        } catch (emailErr) {
            console.error("Password email failed", emailErr);
        }

        // Return here if only password was changed to avoid conflict with other updates
        if (Object.keys(body).length === 1) {
            return NextResponse.json({ success: true, message: "Password updated successfully" });
        }
      }

      // --- 2. Profile Details Update Logic ---
      const fieldsToCheck = ['name', 'fatherName', 'phone', 'school', 'classLevel'];
      
      fieldsToCheck.forEach(field => {
          if (body[field] !== undefined && body[field] !== user[field]) {
               changes.push(`<b>${field.charAt(0).toUpperCase() + field.slice(1)}</b> changed to: ${body[field]}`);
               user[field] = body[field];
          }
      });

      if (body.isActive !== undefined && body.isActive !== user.isActive) {
          changes.push(`<b>Account Status</b> changed to: ${body.isActive ? 'Active' : 'Deactivated'}`);
          user.isActive = body.isActive;
      }
  
      await user.save();
  
      // Send Profile Update Email
      if (changes.length > 0) {
          try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Profile Update Notification - LearnR",
                html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
                    <h2 style="color: #facc15;">Profile Updated by Admin</h2>
                    <p>Hello ${user.name},</p>
                    <p>The following details in your LearnR account have been updated:</p>
                    <ul style="background: #f9f9f9; padding: 15px 30px; border-radius: 5px;">
                    ${changes.map(change => `<li style="margin-bottom: 5px;">${change}</li>`).join('')}
                    </ul>
                </div>
                `,
            });
          } catch (emailErr) {
             console.error("Profile email failed", emailErr);
          }
      }
  
      return NextResponse.json({ success: true, user });
  
    } catch (error) {
      console.error("Update User API Error:", error);
      return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
    }
  }