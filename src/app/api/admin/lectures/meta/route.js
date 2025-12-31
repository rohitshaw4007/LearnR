import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // YouTube oEmbed endpoint se data fetch karna
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch metadata");
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      html: data.html, // Iframe code agar chahiye ho
      author_name: data.author_name
    });

  } catch (error) {
    return NextResponse.json({ error: "Could not fetch video details. Please enter manually." }, { status: 500 });
  }
}