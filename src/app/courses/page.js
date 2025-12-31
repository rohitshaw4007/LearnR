export const dynamic = "force-dynamic"; // Yeh line caching issue fix karegi
import connectDB from "@/lib/db";
import Course from "@/models/Course";
import CoursesClient from "@/components/courses/CoursesClient";

// 100% Data Fetching (Server Side)
async function getAllCourses() {
  try {
    await connectDB();
    const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    console.error("Courses Fetch Error:", error);
    return [];
  }
}

export const metadata = {
  title: "All Courses - LearnR",
  description: "Explore our complete range of English learning courses for school students.",
};

export default async function AllCoursesPage() {
  const courses = await getAllCourses();

  return (
    <main className="relative min-h-screen bg-black overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200">
      
      {/* --- BACKGROUND START (Same as before) --- */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed top-1/3 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      {/* --- BACKGROUND END --- */}


      {/* HEADER SECTION */}
      {/* CHANGED: Padding reduced from 'pt-32' to 'pt-24 md:pt-28' */}
      <section className="relative pt-24 md:pt-28 pb-12 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
            
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md mb-6 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-[10px] md:text-xs font-bold text-yellow-400 uppercase tracking-widest">
                Premium Curriculum
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
              Explore Our <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-600">
                Smart Curriculum
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Unlock your potential with courses designed for school champions. 
              Search by topic, class, or skill level.
            </p>
        </div>
      </section>

      {/* CLIENT SECTION (Search & Grid) */}
      <div className="relative z-10">
        <CoursesClient initialCourses={courses} />
      </div>

    </main>
  );
}