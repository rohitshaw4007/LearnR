import connectDB from "@/lib/db";
import Review from "@/models/Review";
import ReviewsUI from "./ReviewsUI";

async function getReviews() {
  try {
    // Database connection try karega
    await connectDB();
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(10).lean();
    
    // Data ko clean karke return karega
    return reviews.map((review) => ({
      ...review,
      _id: review._id.toString(),
      createdAt: review.createdAt ? review.createdAt.toString() : null,
      updatedAt: review.updatedAt ? review.updatedAt.toString() : null,
    }));
  } catch (error) {
    // Agar DB connect nahi hua (ETIMEOUT), toh error console mein dikhayega
    // lekin website crash nahi hogi, empty array return karega
    console.error("Database Connection Failed (Reviews):", error.message);
    return []; 
  }
}

export default async function StudentReviews() {
  const reviews = await getReviews();

  return (
    // FIX: 'z-30' add kiya hai taaki form niche wale sections se na dabe
    <section className="relative z-30 py-12 md:py-24 overflow-hidden bg-black">
      
      {/* Background unchanged */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 md:left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] bg-yellow-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[100vw] mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 px-4">
            <div className="inline-block px-3 py-1 md:px-4 md:py-1.5 border border-yellow-500/20 rounded-full bg-yellow-500/5 backdrop-blur-md mb-4 md:mb-6 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]">
                <span className="text-[10px] md:text-xs font-bold text-yellow-400 uppercase tracking-[0.2em]">Community Feedback</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter">
                Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">Stories</span>
            </h2>
            <p className="text-gray-500 mt-2 md:mt-4 max-w-xl mx-auto text-sm md:text-lg font-light px-4">
              Real experiences from students who transformed their English skills.
            </p>
        </div>

        {/* Reviews UI Component */}
        <ReviewsUI reviews={reviews} />

      </div>
    </section>
  );
}