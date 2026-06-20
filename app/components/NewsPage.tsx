'use client';

import React, { useState, useEffect } from 'react';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

interface NewsPageProps {
  currentUser: any;
}

const NewsPage: React.FC<NewsPageProps> = ({ currentUser }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Error connecting to news pipeline:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatNewsDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-200 overflow-y-auto flex flex-col relative select-none">
      <div className="bg-gradient-to-r from-[#0d122b] to-[#080b18] border border-[#161f42] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hindustan Times Wire</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time media feeds synchronized with operational information portals.</p>
        </div>
        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-wider rounded-md">
          Live Sync Active
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-mono text-[11px]">BUFFERING REALTIME FEEDS...</p>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs font-semibold bg-[#0a0e24] border border-[#161f42] rounded-2xl shadow-inner">
          No matching operational news clusters captured in this cycle.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0a0e24] border border-[#161f42] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#223163] hover:shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all duration-200"
            >
              <div>
                {item.urlToImage ? (
                  <div className="h-44 w-full relative overflow-hidden bg-[#03050d] border-b border-[#141b3a]">
                    <img
                      src={item.urlToImage}
                      alt="News Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-full bg-gradient-to-r from-blue-950/20 to-transparent border-b border-[#141b3a]/30"></div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[9px] font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase font-mono">
                      {item.source.name || 'HT Media'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatNewsDate(item.publishedAt)}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-medium line-clamp-3">
                    {item.description || 'Click to access standard telemetry metrics and full editorial coverage directly on the publication node.'}
                  </p>
                </div>
              </div>

              <div className="mx-5 mb-5 pt-3 border-t border-[#141b3a] flex items-center justify-end text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                <span className="flex items-center gap-1">
                  Read Article 
                  <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;