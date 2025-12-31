import HeroSection from "../components/homepage/HeroSection";
import Features from "../components/homepage/Features";
import CoursesSection from "../components/homepage/CoursesSection"; // <-- Import kiya
import AboutSection from "../components/homepage/AboutSection";
import StudentReviews from "../components/homepage/StudentReviews";
import ContactSection from "../components/homepage/ContactSection";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <HeroSection />
      <Features />
      
      {/* Naya Section yahan lagaya */}
      <CoursesSection />
      
      <AboutSection />
      <StudentReviews />
      <ContactSection /> 
    </main>
  );
}