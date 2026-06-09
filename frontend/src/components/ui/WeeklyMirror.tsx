import React from 'react';
import { AlertTriangle, ChevronRight, Activity } from 'lucide-react';

interface AnalysisData {
  summary: string;
  flaw_appearances: Array<{ flaw: string; evidence: string; severity: number }>;
  pillar_focus: Record<string, string>;
  directive: string;
  timestamp?: string;
}

export function WeeklyMirror({ data }: { data: AnalysisData | null }) {
  if (!data) {
    return (
      <div className="border border-surface2 bg-obsidian p-6 text-center text-text-dim font-mono">
        NO PATTERN ANALYSIS AVAILABLE
      </div>
    );
  }

  return (
    <div className="border border-surface2 bg-surface p-6 font-mono space-y-6">
      <div className="flex justify-between items-center border-b border-surface2 pb-4">
        <h2 className="text-xl font-heading text-vm-red tracking-widest flex items-center gap-2">
          <AlertTriangle className="text-vm-red w-5 h-5" />
          WEEKLY OPERATOR MIRROR
        </h2>
        {data.timestamp && (
          <span className="text-xs text-text-dim">
            {new Date(data.timestamp).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="text-lg leading-relaxed text-gray-300 font-garamond italic border-l-2 border-gold pl-4">
        "{data.summary}"
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-gold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> VULNERABILITIES DETECTED
          </h3>
          <ul className="space-y-3">
            {data.flaw_appearances?.map((flaw, idx) => (
              <li key={idx} className="bg-obsidian border border-surface2 p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <strong className="text-vm-red">{flaw.flaw}</strong>
                  <span className="text-xs bg-vm-red/20 text-vm-red px-2 py-0.5 rounded">
                    SEV {flaw.severity}
                  </span>
                </div>
                <div className="text-text-dim mt-1">{flaw.evidence}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold mb-3">PILLAR REALITY CHECK</h3>
          <div className="space-y-3">
            {data.pillar_focus && Object.entries(data.pillar_focus).map(([pillar, review]) => (
              <div key={pillar} className="border-b border-surface2 pb-2">
                <strong className="text-sm tracking-widest block mb-1">{pillar}</strong>
                <span className="text-sm text-gray-400">{review}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gold/10 border border-gold p-4 mt-4">
        <h3 className="text-gold font-bold mb-2 tracking-widest flex items-center gap-2">
          <ChevronRight className="w-5 h-5" /> NEW DIRECTIVE
        </h3>
        <p className="text-gold-bright text-lg font-heading pl-7">{data.directive}</p>
      </div>
    </div>
  );
}
