import connectDB from "@/lib/db";
import Course from "@/models/Course";
import Link from "next/link";

async function getCourses() {
  try {
    await connectDB();
    const courses = await Course.find({}).sort({ createdAt: -1 }).limit(4);
    return courses;
  } catch (error) {
    console.error("Courses Fetch Error:", error);
    return [];
  }
}

export default async function CoursesSection() {
  const courses = await getCourses();

  return (
    <section className="relative py-12 md:py-32 bg-[#050505] overflow-hidden" id="courses">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/40 via-[#050505] to-[#050505] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 md:mb-24 space-y-3 md:space-y-4">
            <div className="inline-block px-3 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10 backdrop-blur-md">
              <span className="text-[10px] md:text-xs font-bold text-yellow-400 uppercase tracking-widest">
                Our Curriculum
              </span>
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-white">
              Courses Designed for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-600">School Champions</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto">
              From grammar basics to olympiad level prep, find the perfect course to boost your grades and confidence.
            </p>
        </div>

        {/* UPDATED LAYOUT LOGIC:
           1. Mobile: flex + overflow-x-auto (Horizontal Scroll)
           2. Desktop: grid + grid-cols-4 (Normal Grid)
        */}
        <div className="
            flex md:grid 
            overflow-x-auto md:overflow-visible 
            snap-x snap-mandatory 
            gap-4 md:gap-8 
            pb-8 md:pb-0 
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] 
            md:grid-cols-2 lg:grid-cols-4
        ">
          {courses.map((course) => (
            <Link 
              href={`/courses/${course._id}`}
              key={course._id}
              // UPDATED CARD SIZING:
              // Added 'block' to ensure Link behaves like a container
              className="
                block group relative 
                min-w-[280px] w-[85vw] md:w-auto flex-shrink-0 snap-center 
                bg-gray-900/40 border border-white/10 rounded-3xl overflow-hidden 
                hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2
              "
            >
              
              <div className={`h-2 w-full bg-gradient-to-r ${course.gradient || 'from-yellow-500 to-orange-500'}`}></div>

              <div className="p-6 md:p-8 space-y-4">
                
                <div className="flex justify-between items-start">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                     {course.category}
                   </span>
                   <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                     <span className="text-yellow-400 text-xs font-bold">★ {course.rating}</span>
                   </div>
                </div>

                <div>
                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2 min-h-[3.5rem]">
                     {course.title}
                   </h3>
                   <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 min-h-[4.5rem]">
                     {course.description}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-white/5 pt-4">
                   <div className="flex items-center gap-1.5">
                     <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {course.duration}
                   </div>
                   <div className="flex items-center gap-1.5">
                     <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                     {course.students}+ Students
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div>
                     <span className="text-gray-500 text-xs">Starting at</span>
                     <p className="text-white font-bold text-lg">₹{course.price}</p>
                   </div>
                   <button className="bg-white text-black font-bold text-sm px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors">
                     Enroll
                   </button>
                </div>

              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 md:mt-16 text-center">
            <Link href="/courses" className="group relative inline-flex items-center gap-2 px-6 py-2 md:px-8 md:py-3 bg-transparent border border-white/20 text-white rounded-full hover:border-yellow-500 hover:text-yellow-400 transition-all text-sm md:text-base">
                <span>View All Courses</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </Link>
        </div>

      </div>
    </section>
  );
}