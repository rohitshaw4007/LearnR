// src/app/courses/[id]/page.js
import connectDB from "@/lib/db";
import Course from "@/models/Course";
import CourseDetails from "@/components/courses/CourseDetails";
import mongoose from "mongoose";
import { notFound } from "next/navigation";

// Data Fetching Function
async function getCourse(id) {
  try {
    await connectDB();
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    const course = await Course.findById(id).lean();
    if (!course) return null;
    
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error("Course Fetch Error:", error);
    return null;
  }
}

// FIX 1: generateMetadata me params ko await karein
export async function generateMetadata(props) {
  const params = await props.params; // Yahan await zaroori hai
  const course = await getCourse(params.id);
  
  if (!course) return { title: "Course Not Found" };
  
  return {
    title: `${course.title} - LearnR`,
    description: course.description,
  };
}

// FIX 2: Page component me bhi params ko await karein
export default async function CoursePage(props) {
  const params = await props.params; // Yahan bhi await zaroori hai
  const course = await getCourse(params.id);

  if (!course) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-yellow-500/30">
      <CourseDetails course={course} />
    </main>
  );
}