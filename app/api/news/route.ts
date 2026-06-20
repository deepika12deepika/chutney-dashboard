import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

async function fetchNewsCluster(query: string, apiKey: string) {
  try {
    // Top media portals ensure real destination links
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch (error) {
    console.error(`[Pipeline Error] Query: ${query}`, error);
    return [];
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🚨 AAPNA REAl API KEY YAHAN DALEN YA .env FILE MEIN SET KAREIN
    const API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY';

    // AGAR LIVE API KEY NAHI HAI -> TOH DUMMY '#' KE BAJAY REAL VALID LINKS KAREIN
    if (!API_KEY || API_KEY === 'YOUR_NEWS_API_KEY') {
      return NextResponse.json({
        politics: [
          { 
            title: "Global Summit Outlines Strategic Infrastructure Alignments", 
            description: "World leaders establish synchronized operational baselines for cross-border logistics.", 
            url: "https://www.reuters.com/world/", 
            urlToImage: null, 
            publishedAt: new Date().toISOString(), 
            source: { name: "Reuters" } 
          },
          { 
            title: "Parliament Passes New National Security and Governance Bill", 
            description: "New legislative policy targets high-throughput execution frameworks across state portals.", 
            url: "https://www.ndtv.com/india-news", 
            urlToImage: null, 
            publishedAt: new Date().toISOString(), 
            source: { name: "NDTV" } 
          }
        ],
        sports: [
          { 
            title: "Championship Finals: Underdogs Secure Historic Victory", 
            description: "A masterclass in strategic tactical deployment shifts the competitive balance of the tournament.", 
            url: "https://www.espn.in", 
            urlToImage: null, 
            publishedAt: new Date().toISOString(), 
            source: { name: "ESPN" } 
          }
        ],
        entertainment: [
          { 
            title: "Global Streaming Platforms Announce Major Cinematic Pipeline Ventures", 
            description: "Production nodes chart massive capital infusions targeting diverse visual structural content.", 
            url: "https://variety.com", 
            urlToImage: null, 
            publishedAt: new Date().toISOString(), 
            source: { name: "Variety" } 
          }
        ],
        business: [
          { 
            title: "Markets Rally to All-Time Highs Amid Corporate Tech Investments", 
            description: "Financial metrics indicate high momentum pipelines following regional regulatory clearances.", 
            url: "https://www.bloomberg.com", 
            urlToImage: null, 
            publishedAt: new Date().toISOString(), 
            source: { name: "Bloomberg" } 
          }
        ]
      });
    }

    // Agar key sahi hai, toh live categories fetch hongi pure real links ke saath
    const [politics, sports, entertainment, business] = await Promise.all([
      fetchNewsCluster('(politics OR government) AND (India OR world)', API_KEY),
      fetchNewsCluster('(sports OR cricket OR football)', API_KEY),
      fetchNewsCluster('(entertainment OR bollywood OR hollywood)', API_KEY),
      fetchNewsCluster('(business OR finance OR stocks OR tech)', API_KEY),
    ]);

    return NextResponse.json({ politics, sports, entertainment, business });
  } catch (error) {
    console.error('[Global News Route Error]', error);
    return NextResponse.json({ error: 'Failed to stream data' }, { status: 500 });
  }
}