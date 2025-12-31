import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // Fixed Import Name
import LiveChat from "@/models/LiveChat"; // Ensure this model exists

// GET: Fetch Chat Messages
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId || courseId === "undefined") {
        return NextResponse.json([], { status: 200 });
    }

    // Fetch last 100 messages sorted by time
    const messages = await LiveChat.find({ courseId })
                                   .sort({ timestamp: 1 })
                                   .limit(100);
                                   
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Chat Fetch Error:", error);
    // Return empty array instead of crashing
    return NextResponse.json([], { status: 500 }); 
  }
}

// POST: Send New Message
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { courseId, senderName, message, senderRole } = body;

    if (!courseId || !message) {
        return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const newChat = await LiveChat.create({
      courseId,
      senderName,
      message,
      senderRole, // 'admin' or 'student'
      timestamp: new Date()
    });

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error("Chat Send Error:", error);
    return NextResponse.json({ message: "Error sending message" }, { status: 500 });
  }
}