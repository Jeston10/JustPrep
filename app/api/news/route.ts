import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // You can get a free API key from https://gnews.io/
    // For now, we'll use a fallback approach or you can add your API key to .env.local
    const apiKey = process.env.GNEWS_API_KEY || "demo"; // Use "demo" as fallback
    
    // If using demo key, return mock data immediately
    if (apiKey === "demo") {
      return NextResponse.json({
        articles: [
          {
            title: "The Future of AI in Software Development",
            url: "https://example.com/ai-future",
            source: { name: "Tech News" },
            publishedAt: new Date().toISOString()
          },
          {
            title: "New JavaScript Framework Released",
            url: "https://example.com/js-framework",
            source: { name: "Developer Weekly" },
            publishedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            title: "Cloud Computing Trends 2024",
            url: "https://example.com/cloud-trends",
            source: { name: "Cloud Today" },
            publishedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            title: "Cybersecurity Best Practices",
            url: "https://example.com/cyber-security",
            source: { name: "Security Weekly" },
            publishedAt: new Date(Date.now() - 259200000).toISOString()
          },
          {
            title: "Mobile App Development Trends",
            url: "https://example.com/mobile-trends",
            source: { name: "Mobile Dev" },
            publishedAt: new Date(Date.now() - 345600000).toISOString()
          },
          {
            title: "Web3 and Blockchain Innovation",
            url: "https://example.com/web3-innovation",
            source: { name: "Blockchain News" },
            publishedAt: new Date(Date.now() - 432000000).toISOString()
          },
          {
            title: "Data Science and Machine Learning",
            url: "https://example.com/data-science",
            source: { name: "Data Weekly" },
            publishedAt: new Date(Date.now() - 518400000).toISOString()
          }
        ]
      });
    }
    
    // Only make API call if we have a real API key
    const response = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=technology&lang=en&max=28&apikey=${apiKey}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`News API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("News API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
