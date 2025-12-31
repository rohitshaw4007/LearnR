export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/'], // Admin और Dashboard को सर्च में नहीं दिखाना चाहिए
    },
    sitemap: 'https://learn-r-five.vercel.app/sitemap.xml',
  }
}