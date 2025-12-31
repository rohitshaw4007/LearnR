export default function sitemap() {
  const baseUrl = 'https://learn-r-five.vercel.app'; // अपनी डोमेन यहाँ लिखें

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    // आप यहाँ और भी डायनामिक पेजेस जोड़ सकते हैं (जैसे courses/id)
  ];
}