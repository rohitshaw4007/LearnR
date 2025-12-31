import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lecture from "@/models/Lecture";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    // FIX: params ko await karein (Next.js 15 update)
    const { id } = await params; 

    // Lectures ko Chapter aur Order ke hisaab se sort karke bhejein
    const lectures = await Lecture.find({ courseId: id })
      .sort({ chapter: 1, order: 1 });

    return NextResponse.json({ lectures });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return NextResponse.json({ error: "Failed to load lectures" }, { status: 500 });
  }
}