import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";

// DELETE NOTICE
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Next.js 15 safe
    
    await Notice.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true, message: "Notice deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE NOTICE
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { title, content, priority, durationHours } = await req.json();

    let updateData = { title, content, priority };

    // Agar duration change ki hai, to nayi expiry date set karein
    if (durationHours) {
        const expireAt = new Date();
        expireAt.setHours(expireAt.getHours() + parseInt(durationHours));
        updateData.expireAt = expireAt;
    }

    await Notice.findByIdAndUpdate(id, updateData);

    return NextResponse.json({ success: true, message: "Notice updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}