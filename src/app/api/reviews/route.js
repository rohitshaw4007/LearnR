import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Review from "@/models/Review";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Validation: Check if fields are empty
    if (!data.name || !data.message || !data.role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Create new review
    const newReview = await Review.create({
      name: data.name,
      role: data.role,
      message: data.message,
      rating: data.rating || 5, // Default 5 stars
    });

    return NextResponse.json({ message: "Review added successfully!", review: newReview }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}