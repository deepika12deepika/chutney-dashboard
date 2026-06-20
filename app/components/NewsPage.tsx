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

interface NewsDataState {
  politics: Article[];
  sports: Article[];
  entertainment: Article[];
  business: Article[];
}

interface NewsPageProps {
  currentUser: any;
}

const NewsPage: React.FC<NewsPageProps> = ({ currentUser }) => {
  const [newsCluster, setNewsCluster] = useState<NewsDataState>({
    politics: [],
    sports: [],
    entertainment: [],
    business: [],
  });
  const [activeSegment, setActiveSegment] = useState<keyof NewsDataState>('politics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function streamNewsHub() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNewsCluster({
            politics: data.politics || [],
            sports: data.sports || [],
            entertainment: data.entertainment || [],
            business: data.business || [],
          });
        }
      } catch (err) {
        console.error('Operational error connecting to distributed news nodes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    streamNewsHub();
  }, []);

  const formatPublishTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentArticles = newsCluster[activeSegment] || [];

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-200 overflow-y-auto flex flex-col relative select-none">
      
      {/* Dynamic Header Block */}
      <div className="bg-gradient-to-r from-[#0a0f24] via-[#0d122b] to-[#060814] border border-[#161f42] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase font-mono bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Omni-Channel News Terminal
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Aggregated global frameworks running live streams from major international & regional networks.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-wider rounded-lg w-fit">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          Decentralized Sync Active
        </div>
      </div>

      {/* Segment Navigation Grid Control */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 border-b border-[#161f42]/60 pb-6">
        {(['politics', 'sports', 'entertainment', 'business'] as Array<keyof NewsDataState>).map((segment) => (
          <button
            key={segment}
            onClick={() => setActiveSegment(segment)}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border text-center ${
              activeSegment === segment
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-xl shadow-blue-900/30 scale-[1.02]'
                : 'bg-[#0a0e24] border-[#161f42] text-slate-400 hover:text-white hover:border-slate-700 hover:bg-[#0c1230]'
            }`}
          >
            {segment === 'politics' && '🏛️ Global Politics'}
            {segment === 'sports' && '🏆 World Sports'}
            {segment === 'entertainment' && '🎬 Entertainment'}
            {segment === 'business' && '📈 Tech & Markets'}
          </button>
        ))}
      </div>

      {/* Main Distributed Grid Workspace */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-mono text-xs tracking-widest uppercase animate-pulse">
              Buffering global media channels...
            </p>
          </div>
        </div>
      ) : currentArticles.length === 0 ? (
        <div className="py-24 text-center text-slate-500 font-mono text-xs border border-dashed border-[#161f42] rounded-2xl bg-[#0a0e24]/40">
          No current operational segments recorded in this array sector.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentArticles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0a0e24] border border-[#161f42] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#263770] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div>
                {/* Media Node Header Image */}
                {article.urlToImage ? (
                  <div className="h-44 w-full relative overflow-hidden bg-[#03050d] border-b border-[#141b3a]">
                    <img
                      src={article.urlToImage}
                      alt="Telemetry Node Banner"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-[#10163a] to-[#060814] border-b border-[#141b3a] flex items-center justify-center">
                    <span className="text-3xl opacity-10 font-mono select-none font-bold">LIVE WIRE</span>
                  </div>
                )}

                {/* Main Card Context */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase font-mono max-w-[120px] truncate">
                      {article.source.name || 'Global Wire'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {formatPublishTime(article.publishedAt)}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-bold text-white leading-snug tracking-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-4 font-normal">
                    {article.description || 'No summary stream received. Click to read full editorial telemetry report data directly on primary network host.'}
                  </p>
                </div>
              </div>

              {/* Explicit Exit Action Node */}
              <div className="mx-5 mb-5 pt-4 border-t border-[#141b3a] flex items-center justify-between text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                <span className="text-[9px] opacity-40 uppercase tracking-tight">Node #{index + 1}</span>
                <span className="flex items-center gap-1 font-bold">
                  View Full Report
                  <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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