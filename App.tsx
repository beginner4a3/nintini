import React, { useState } from 'react';
import { PodcastForm } from './components/PodcastForm';
import { ScriptDisplay } from './components/ScriptDisplay';
import { AudioPlayer } from './components/AudioPlayer';
import { PodcastConfig, AppState, GeneratedContent } from './types';
import { DEFAULT_SPEAKERS } from './constants';
import { generatePodcastScript } from './services/gemini';
import { generateLocalPodcastAudio } from './services/localTTS';
import { Mic, Laptop } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<PodcastConfig>({
    sourceMode: 'topic',
    topic: '',
    file: null,
    language: 'Hindi', 
    duration: 'Short',
    speaker1: DEFAULT_SPEAKERS.host1,
    speaker2: DEFAULT_SPEAKERS.host2,
  });

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [content, setContent] = useState<GeneratedContent>({
    script: [],
    audioUrl: null,
    audioBlob: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>("");

  const handleGenerateScript = async () => {
    try {
      setAppState(AppState.GENERATING_SCRIPT);
      setError(null);
      setContent(prev => ({ ...prev, script: [], audioUrl: null, audioBlob: null }));

      const script = await generatePodcastScript(config);
      setContent(prev => ({ ...prev, script }));
      setAppState(AppState.SCRIPT_READY);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate script");
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerateAudio = async () => {
    if (content.script.length === 0) return;

    try {
      setAppState(AppState.GENERATING_AUDIO);
      setError(null);
      setProgressText("Loading TTS engine...");

      const blob = await generateLocalPodcastAudio(
        content.script, 
        config, 
        (status) => setProgressText(status)
      );
      
      const url = URL.createObjectURL(blob);
      setContent(prev => ({ ...prev, audioBlob: blob, audioUrl: url }));
      setAppState(AppState.PLAYING);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Audio generation failed.");
      setAppState(AppState.SCRIPT_READY);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-950 border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                PodGen.ai
              </h1>
              <span className="text-xs text-indigo-400 font-medium">Self-Hosted Engine • Offline Capable</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-900 py-1 px-3 rounded-full border border-slate-800">
            <Laptop size={12} />
            <span>Running in Browser</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 pb-32">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-4 h-full overflow-hidden">
            <PodcastForm 
              config={config} 
              setConfig={setConfig} 
              onGenerate={handleGenerateScript}
              appState={appState}
            />
          </div>

          {/* Right Area - Script & Visualization */}
          <div className="lg:col-span-8 h-full overflow-hidden flex flex-col gap-4">
            
            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <ScriptDisplay 
                script={content.script}
                speaker1={config.speaker1}
                speaker2={config.speaker2}
                onGenerateAudio={handleGenerateAudio}
                hasAudio={!!content.audioUrl}
                isGeneratingAudio={appState === AppState.GENERATING_AUDIO}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Player */}
      {content.audioUrl && (
        <div className="animate-in slide-in-from-bottom-10 duration-500">
           <AudioPlayer 
             audioUrl={content.audioUrl} 
             topic={config.topic || config.file?.name || 'Podcast'} 
           />
        </div>
      )}

      {/* Loading Overlay */}
      {appState === AppState.GENERATING_AUDIO && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
             <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Generating Audio</h3>
             <p className="text-slate-400 text-sm mb-4">Running local neural engine...</p>
             <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
               <div className="h-full bg-indigo-500 w-full animate-pulse"></div>
             </div>
             <p className="text-xs text-slate-500 mt-2 font-mono">{progressText}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;