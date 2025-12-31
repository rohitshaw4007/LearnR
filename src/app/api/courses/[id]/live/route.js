import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; 
import Course from "@/models/Course";
import User from "@/models/User";
import LiveChat from "@/models/LiveChat"; // <--- IMPORT THIS MODEL
import nodemailer from "nodemailer";

// GET: Live Status Check
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const course = await Course.findById(id).select("liveRoom");
    
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });

    return NextResponse.json(course.liveRoom || { isLive: false }, { status: 200 });
  } catch (error) {
    console.error("GET Live Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

// POST: Go Live / End Live
export async function POST(req, { params }) {
  try {
    await connectDB(); 
    const { id } = await params;
    const body = await req.json();
    const { isLive, youtubeId, topic } = body;

    // 1. Update Database (Live Status)
    const updateData = {
      "liveRoom.isLive": isLive,
      "liveRoom.youtubeId": youtubeId || "",
      "liveRoom.topic": topic || "",
      "liveRoom.startedAt": isLive ? new Date() : null
    };

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // --- NEW FEATURE: DELETE CHATS ON CLASS END ---
    // Agar class End ho rahi hai (isLive == false), to purani chats uda do
    if (isLive === false) {
        try {
            await LiveChat.deleteMany({ courseId: id });
            console.log(`Cleanup: All chats deleted for course ${id}`);
        } catch (cleanupError) {
            console.error("Failed to delete chats:", cleanupError);
        }
    }
    // ----------------------------------------------

    // 2. Send Email (Only if Going Live)
    if (isLive) {
      try {
        const students = await User.find({ courses: id }).select("email name");
        
        if (students.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });

          Promise.all(students.map(student => {
            return transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: student.email,
              subject: `🔴 Live Now: ${topic}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fff;">
                  <h2 style="color: #ef4444;">Live Class Started!</h2>
                  <p>Hi <strong>${student.name}</strong>,</p>
                  <p>Your instructor is now live: <strong>${topic}</strong>.</p>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/classroom/${id}" 
                     style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                     Join Class
                  </a>
                </div>
              `
            }).catch(e => console.error(`Failed to email ${student.email}`, e));
          }));
        }
      } catch (emailErr) {
        console.error("Email System Error:", emailErr);
      }
    }

    return NextResponse.json(course.liveRoom, { status: 200 });

  } catch (error) {
    console.error("Live Update Error:", error);
    return NextResponse.json({ message: error.message || "Error updating status" }, { status: 500 });
  }
}