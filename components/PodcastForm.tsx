import React, { useState } from 'react';
import { PodcastConfig, Speaker, AppState } from '../types';
import { AVAILABLE_VOICES, SUPPORTED_LANGUAGES, SAMPLE_TOPICS } from '../constants';
import { Settings2, Mic2, Sparkles, FileText, Type, UploadCloud, X, File as FileIcon } from 'lucide-react';
import mammoth from 'mammoth';

interface Props {
  config: PodcastConfig;
  setConfig: React.Dispatch<React.SetStateAction<PodcastConfig>>;
  onGenerate: () => void;
  appState: AppState;
}

export const PodcastForm: React.FC<Props> = ({ config, setConfig, onGenerate, appState }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);

  const handleSpeakerChange = (key: 'speaker1' | 'speaker2', field: keyof Speaker, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setProcessingFile(true);
    try {
      if (file.type === 'application/pdf') {
        // Handle PDF: Read as Base64 for Gemini multimodal input
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip "data:application/pdf;base64," header
          const base64Data = result.split(',')[1];
          setConfig(prev => ({
            ...prev,
            file: {
              name: file.name,
              type: file.type,
              content: base64Data
            }
          }));
          setProcessingFile(false);
        };
        reader.readAsDataURL(file);

      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle DOCX: Extract text using mammoth
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setConfig(prev => ({
              ...prev,
              file: {
                name: file.name,
                type: file.type,
                content: result.value // The raw text
              }
            }));
          } catch (err) {
            console.error("Mammoth error:", err);
            alert("Failed to read DOCX file.");
          }
          setProcessingFile(false);
        };
        reader.readAsArrayBuffer(file);

      } else if (file.type === 'text/plain') {
        // Handle Text Files
        const reader = new FileReader();
        reader.onload = () => {
          setConfig(prev => ({
            ...prev,
            file: {
              name: file.name,
              type: file.type,
              content: reader.result as string
            }
          }));
          setProcessingFile(false);
        };
        reader.readAsText(file);
      } else {
        alert("Unsupported file type. Please upload PDF, DOCX, or TXT.");
        setProcessingFile(false);
      }
    } catch (error) {
      console.error("File processing error", error);
      setProcessingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const isGenerating = appState === AppState.GENERATING_SCRIPT || appState === AppState.GENERATING_AUDIO;
  const isReady = (config.sourceMode === 'topic' && config.topic.trim().length > 0) || (config.sourceMode === 'file' && config.file !== null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full overflow-y-auto flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-indigo-400">
        <Settings2 size={24} />
        <h2 className="text-xl font-bold">Studio Settings</h2>
      </div>

      <div className="space-y-6 flex-1">
        
        {/* Source Toggle */}
        <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setConfig(prev => ({ ...prev, sourceMode: 'topic' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              config.sourceMode === 'topic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type size={16} />
            Topic Input
          </button>
          <button
            onClick={() => setConfig(prev => ({ ...prev, sourceMode: 'file' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              config.sourceMode === 'file' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={16} />
            Upload File
          </button>
        </div>

        {/* Content Input Area */}
        <div className="min-h-[140px]">
          {config.sourceMode === 'topic' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="block text-sm font-medium text-slate-400 mb-2">Podcast Topic</label>
              <textarea
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="e.g. The history of Bollywood music..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-32 resize-none transition-all"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {SAMPLE_TOPICS.slice(0, 3).map((t, i) => (
                  <button 
                    key={i}
                    onClick={() => setConfig({ ...config, topic: t })}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-full transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <label className="block text-sm font-medium text-slate-400 mb-2">Source Document (PDF, DOCX, TXT)</label>
               
               {!config.file ? (
                 <div 
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center text-center p-4 transition-all ${
                     isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                   }`}
                 >
                   {processingFile ? (
                     <div className="flex flex-col items-center text-indigo-400">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs">Processing file...</span>
                     </div>
                   ) : (
                     <>
                      <UploadCloud className="text-slate-500 mb-2" size={24} />
                      <p className="text-sm text-slate-300 mb-1">Drag & drop or <label htmlFor="file-upload" className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium hover:underline">browse</label></p>
                      <p className="text-xs text-slate-500">Supports PDF, DOCX, TXT</p>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                      />
                     </>
                   )}
                 </div>
               ) : (
                 <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between group border border-slate-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <FileIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{config.file.name}</p>
                        <p className="text-xs text-slate-400 uppercase">{config.file.type.split('/')[1]?.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX') || 'FILE'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig(prev => ({ ...prev, file: null }))}
                      className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Language & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
            <select
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Duration</label>
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              {['Short', 'Medium', 'Long'].map((d) => (
                <button
                  key={d}
                  onClick={() => setConfig({ ...config, duration: d as any })}
                  className={`flex-1 text-sm py-2 rounded-md transition-all ${
                    config.duration === d 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Speakers Configuration */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-4">Hosts Configuration</label>
          
          {/* Host 1 */}
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">H1</div>
              <input
                type="text"
                value={config.speaker1.name}
                onChange={(e) => handleSpeakerChange('speaker1', 'name', e.target.value)}
                className="bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none text-slate-200 text-sm w-full pb-1"
                placeholder="Name"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Mic2 size={14} className="text-slate-500" />
              <select
                value={config.speaker1.voiceName}
                onChange={(e) => handleSpeakerChange('speaker1', 'voiceName', e.target.value)}
                className="bg-transparent text-xs text-slate-400 outline-none w-full"
              >
                {AVAILABLE_VOICES.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.gender}) - {v.description}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Host 2 */}
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-xs font-bold">H2</div>
              <input
                type="text"
                value={config.speaker2.name}
                onChange={(e) => handleSpeakerChange('speaker2', 'name', e.target.value)}
                className="bg-transparent border-b border-slate-700 focus:border-pink-500 outline-none text-slate-200 text-sm w-full pb-1"
                placeholder="Name"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Mic2 size={14} className="text-slate-500" />
              <select
                value={config.speaker2.voiceName}
                onChange={(e) => handleSpeakerChange('speaker2', 'voiceName', e.target.value)}
                className="bg-transparent text-xs text-slate-400 outline-none w-full"
              >
                {AVAILABLE_VOICES.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.gender}) - {v.description}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !isReady}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
            isGenerating || !isReady
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:shadow-indigo-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Magic...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generate Podcast</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};