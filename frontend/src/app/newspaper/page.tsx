'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';

export default function NewspaperPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('loading');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.newspaper.get();
      setContent(res.content);
      setStatus(res.status);
    } catch (e) {
      console.error(e);
      setContent("Failed to load the newspaper. The press might be down.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    triggerHaptic('heavy');
    setIsGenerating(true);
    try {
      await api.newspaper.generate();
      setContent("## Printing Press is running...\n\nYour daily newspaper is currently being written. Check back in a minute.");
      setStatus("generating");
      
      // Poll every 5 seconds
      const interval = setInterval(async () => {
        try {
          const res = await api.newspaper.get();
          if (res.status === "ready") {
            setContent(res.content);
            setStatus("ready");
            setIsGenerating(false);
            clearInterval(interval);
            triggerHaptic('success');
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
      
      // Fallback timeout after 60s
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
      }, 60000);

    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#2c2b29] font-serif relative pb-10 overflow-x-hidden selection:bg-black selection:text-[#f4f1ea]">
      {/* Old Paper Texture / Noise overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#f4f1ea]/95 backdrop-blur-sm border-b border-black/10 px-4 py-4 pt-safe flex items-center justify-between">
        <button
          onClick={() => { triggerHaptic('light'); router.push('/'); }}
          className="p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold tracking-[0.2em] text-xs uppercase flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          The Daily Mirror
        </h1>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || status === "generating"}
          className="p-2 -mr-2 text-black/60 hover:text-black transition-colors disabled:opacity-30"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating || status === "generating" ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="px-5 pt-8 max-w-2xl mx-auto space-y-6">
        
        {/* Title Block */}
        <div className="text-center mb-10 border-b-2 border-black/80 pb-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>VIRTUAL MIND DAILY</h2>
          <div className="flex justify-between items-center text-[10px] tracking-widest border-t border-b border-black/20 py-1 mt-4 uppercase">
            <span>VOL. I — NO. 1</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>PRICE: 1 SOUL</span>
          </div>
        </div>

        {/* Content Body */}
        {status === 'loading' ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-black/10 rounded w-3/4"></div>
            <div className="h-4 bg-black/10 rounded w-full"></div>
            <div className="h-4 bg-black/10 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="prose prose-sm md:prose-base prose-neutral max-w-none newspaper-content">
            {/* Extremely simple Markdown renderer for the newspaper vibe */}
            {content.split('\\n').join('\\n').split('\\n\\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h3 key={i} className="text-xl font-bold mt-8 mb-3 uppercase tracking-wider border-b border-black/10 pb-2">{paragraph.replace('## ', '')}</h3>;
              }
              if (paragraph.startsWith('# ')) {
                return <h2 key={i} className="text-2xl font-bold mt-6 mb-4">{paragraph.replace('# ', '')}</h2>;
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={i} className="list-disc pl-5 my-3">
                    {paragraph.split('\\n').map((item, j) => (
                      <li key={j} className="mb-1">{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              }
              
              // Handle bolding
              const formattedText = paragraph;
              const boldRegex = /\\*\\*(.*?)\\*\\*/g;
              if (boldRegex.test(formattedText)) {
                return (
                  <p key={i} className="mb-4 leading-relaxed text-black/80 text-justify"
                    dangerouslySetInnerHTML={{ __html: formattedText.replace(boldRegex, '<strong>$1</strong>') }}
                  />
                );
              }

              return <p key={i} className="mb-4 leading-relaxed text-black/80 text-justify">{paragraph}</p>;
            })}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-black/20 text-center text-xs text-black/40 italic pb-8">
          "The world makes way for the man who knows where he is going."
        </div>
      </div>
    </div>
  );
}
