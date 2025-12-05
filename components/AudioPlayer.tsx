import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Volume2, AudioLines } from 'lucide-react';

interface Props {
  audioUrl: string;
  topic: string;
}

export const AudioPlayer: React.FC<Props> = ({ audioUrl, topic }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <AudioLines size={24} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-100 truncate">{topic}</h4>
            <p className="text-xs text-indigo-400">PodGen.ai Original</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-indigo-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>
          
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full md:w-1/4 flex justify-end gap-3">
           <a 
            href={audioUrl} 
            download={`podgen-${topic.replace(/\s+/g, '-').toLowerCase()}.wav`}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Download Podcast"
           >
             <Download size={20} />
           </a>
           <div className="p-2 text-slate-400 cursor-default">
             <Volume2 size={20} />
           </div>
        </div>
      </div>
    </div>
  );
};
