import React from "react";

export const metadata = {
  title: "Privacy Policy | LearnR",
  description: "Privacy Policy for LearnR platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Privacy <span className="text-yellow-500">Policy</span>
        </h1>
        
        <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
          <p>
            Welcome to <strong>LearnR</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us at support@learnr.com.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Personal Information:</strong> Names, phone numbers, email addresses, mailing addresses, billing addresses.</li>
            <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is stored by our payment processor (Razorpay).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. How We Use Your Information</h2>
          <p>We use personal information collected via our website for a variety of business purposes described below:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To facilitate account creation and logon process.</li>
            <li>To send you administrative information (product, service, and new feature information).</li>
            <li>To fulfill and manage your orders.</li>
            <li>To request feedback and contact you about your use of our website.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Sharing Your Information</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">5. Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>
        </section>
      </div>
    </main>
  );
}