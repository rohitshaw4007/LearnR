import React from "react";

export const metadata = {
  title: "Terms & Conditions | LearnR",
  description: "Terms and Conditions for using LearnR.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Terms & <span className="text-yellow-500">Conditions</span>
        </h1>

        <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
          <p>
            These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <strong>LearnR</strong> ("we," "us" or "our"), concerning your access to and use of the LearnR website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. User Representations</h2>
          <p>By using the Site, you represent and warrant that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>All registration information you submit will be true, accurate, current, and complete.</li>
            <li>You have the legal capacity and you agree to comply with these Terms of Use.</li>
            <li>You are not a minor in the jurisdiction in which you reside.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Purchases and Payment</h2>
          <p>
            We accept payments through various online modes including Credit/Debit Cards, UPI, and Net Banking via our payment partner Razorpay. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">5. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>
        </section>
      </div>
    </main>
  );
}