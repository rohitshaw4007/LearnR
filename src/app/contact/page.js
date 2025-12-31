import React from "react";
import { Phone, Mail, MapPin } from "lucide-react"; // lucide-react ka use karein

export const metadata = {
  title: "Contact Us | LearnR",
  description: "Get in touch with the LearnR team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
             <h1 className="text-4xl md:text-5xl font-bold text-white">
            Contact <span className="text-yellow-500">Us</span>
            </h1>
            <p className="text-gray-400">We'd love to hear from you. Here is how you can reach us.</p>
        </div>
       
        <div className="grid md:grid-cols-3 gap-8">
            {/* Address */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-4 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                    <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Our Office</h3>
                <p className="text-sm">
                    LearnR Headquarters,<br/>
                   Kumarpara Ghat Lane, Telinipara,
                    Bhadreswar, Hooghly (West Bengal), 712125
                </p>
            </div>

            {/* Email */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-4 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                     <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Email Us</h3>
                <p className="text-sm">
                    learnr98@gmail.com<br/>
                </p>
            </div>

            {/* Phone */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-4 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                    <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Call Us</h3>
                <p className="text-sm">
                    +91 7449704463<br/>
                    Mon-Fri, 9am - 6pm
                </p>
            </div>
        </div>
      </div>
    </main>
  );
}