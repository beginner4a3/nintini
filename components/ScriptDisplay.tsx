import React, { useEffect, useRef } from 'react';
import { ScriptLine, Speaker } from '../types';
import { PlayCircle, Type } from 'lucide-react';

interface Props {
  script: ScriptLine[];
  speaker1: Speaker;
  speaker2: Speaker;
  onGenerateAudio: () => void;
  hasAudio: boolean;
  isGeneratingAudio: boolean;
}

export const ScriptDisplay: React.FC<Props> = ({ 
  script, 
  speaker1, 
  speaker2, 
  onGenerateAudio,
  hasAudio,
  isGeneratingAudio
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [script]);

  if (script.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
        <Type size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No script generated yet</p>
        <p className="text-sm">Configure your settings and hit Generate</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200">Generated Script</h3>
        {!hasAudio && (
          <button
            onClick={onGenerateAudio}
            disabled={isGeneratingAudio}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-colors ${
              isGeneratingAudio 
                ? 'bg-slate-800 text-slate-400' 
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {isGeneratingAudio ? (
              <span className="animate-pulse">Synthesizing...</span>
            ) : (
              <>
                <PlayCircle size={14} />
                Generate Audio
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {script.map((line, index) => {
          const isHost1 = line.speakerId === 'Host1';
          const speaker = isHost1 ? speaker1 : speaker2;
          const alignClass = isHost1 ? 'flex-row' : 'flex-row-reverse';
          const bgClass = isHost1 ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-100' : 'bg-pink-900/30 border-pink-800/50 text-pink-100';
          
          return (
            <div key={index} className={`flex gap-4 ${alignClass}`}>
              <div 
                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-lg ${
                  isHost1 ? 'bg-indigo-600 text-white' : 'bg-pink-600 text-white'
                }`}
              >
                {speaker.name[0]}
              </div>
              <div className={`flex-1 max-w-[80%] rounded-2xl p-4 border ${bgClass}`}>
                <div className="text-xs font-bold opacity-50 mb-1 mb-2 uppercase tracking-wider">{speaker.name}</div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{line.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
