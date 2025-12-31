import React from "react";

export const metadata = {
  title: "Shipping Policy | LearnR",
  description: "Shipping and Delivery Policy for LearnR.",
};

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Shipping & <span className="text-yellow-500">Delivery</span>
        </h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Digital Delivery</h2>
          <p>
            Since LearnR is an online learning platform, we do not ship any physical products. All our courses and learning materials are delivered digitally.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Delivery Timeline</h2>
          <p>
            Upon successful payment, you will receive immediate access to your purchased course(s). You will receive a confirmation email with your order details and access instructions.
          </p>
          <p>
            In rare cases of technical delays, access will be granted within 2-4 hours. If you do not receive access within this timeframe, please contact our support team.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. Contact for Issues</h2>
          <p>
            If you face any issues with accessing your course content, please email us at support@learnr.com or contact us via the help center.
          </p>
        </section>
      </div>
    </main>
  );
}