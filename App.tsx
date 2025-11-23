import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Monitor } from './components/Monitor';
import { INITIAL_STATE, StudioState } from './types';
import { generateStudioImage, constructJSONOutput, translateStateForOutput } from './services/geminiService';
import { Youtube, MessageCircle, Instagram, Music2, Clapperboard, Loader2, Edit3, Monitor as MonitorIcon } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<StudioState>(INITIAL_STATE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'editor' | 'monitor'>('editor');
  
  // Generates the JSON preview, now with translation to English
  const handleGenerateJSON = useCallback(async (type: 'image' | 'video') => {
    setIsTranslating(true);
    try {
      const translatedState = await translateStateForOutput(state);
      
      const jsonOutput = constructJSONOutput(translatedState, type);
      setState(prev => ({
        ...prev,
        lastGeneratedOutput: jsonOutput
      }));
      
      setMobileTab('monitor');
    } catch (error) {
      console.error("Error generating JSON:", error);
    } finally {
      setIsTranslating(false);
    }
  }, [state]);

  // Calls Gemini to generate the actual image using translated prompts
  const handleRenderImage = useCallback(async (aspectRatio: "1:1" | "16:9" | "9:16") => {
    if (isGenerating || isTranslating) return;
    
    setIsGenerating(true);
    setGeneratedImage(null); 
    setMobileTab('monitor');

    try {
      const translatedState = await translateStateForOutput(state);
      const jsonOutput = constructJSONOutput(translatedState, 'image');
      setState(prev => ({ ...prev, lastGeneratedOutput: jsonOutput }));

      const result = await generateStudioImage(
        jsonOutput.final_prompt_for_ai, 
        aspectRatio,
        state.referenceImage,
        state.characterReferenceImage
      );
      setGeneratedImage(result);
    } catch (error) {
      console.error("Generation cycle failed:", error);
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isTranslating, state]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] overflow-hidden text-slate-200 font-sans">
      
      {/* Top Navigation - FIXED BLOCK */}
      <div className="h-16 z-50 flex items-center justify-between px-4 md:px-6 bg-[#050505] border-b border-slate-900/50 flex-shrink-0 gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 relative">
             <div className="flex items-center gap-2 opacity-50">
                <div className="bg-red-600/20 p-1.5 rounded text-red-500 flex-shrink-0">
                    <Clapperboard size={16} />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase truncate hidden md:block">Studio Director</span>
             </div>
        </div>
        
        {/* Social Buttons - Scrollable on Mobile */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar mask-gradient-right pr-2 pl-2">
          <a href="https://bit.ly/InstaCLTube" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] md:text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/20">
            <Instagram size={12} />
            <span className="hidden lg:inline">Instagram</span>
          </a>
          <a href="https://bit.ly/3XdZMZd" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black border border-slate-700 text-white text-[10px] md:text-xs font-bold hover:bg-slate-900 transition-colors">
            <Music2 size={12} />
            <span className="hidden lg:inline">TikTok</span>
          </a>
          <a href="https://bit.ly/CLTube-YT" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
            <Youtube size={12} />
            <span className="hidden lg:inline">YouTube</span>
          </a>
          <a href="https://bit.ly/WhatsCLTube" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-600 text-white text-[10px] md:text-xs font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20">
            <MessageCircle size={12} />
            <span className="hidden lg:inline">Comunidade</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Mobile Tabs Control (Only visible on Mobile) */}
        <div className="md:hidden flex border-b border-slate-900 bg-black z-40 flex-shrink-0">
          <button 
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileTab === 'editor' ? 'text-red-500 border-b-2 border-red-500 bg-red-900/10' : 'text-slate-500'}`}
          >
            <Edit3 size={14} />
            Editor
          </button>
          <button 
            onClick={() => setMobileTab('monitor')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileTab === 'monitor' ? 'text-red-500 border-b-2 border-red-500 bg-red-900/10' : 'text-slate-500'}`}
          >
            <MonitorIcon size={14} />
            Monitor
          </button>
        </div>

        {/* Left Sidebar - Director Controls */}
        <div className={`
          ${mobileTab === 'editor' ? 'flex' : 'hidden'} 
          md:flex w-full md:w-[480px] flex-shrink-0 h-full overflow-hidden
        `}>
          <ControlPanel 
            state={state} 
            onUpdate={setState} 
            onGenerateJSON={handleGenerateJSON}
            onRenderImage={handleRenderImage}
            isGenerating={isGenerating || isTranslating}
          />
        </div>

        {/* Main Content - Visual Monitor */}
        <div className={`
          ${mobileTab === 'monitor' ? 'flex' : 'hidden'} 
          md:flex flex-1 h-full relative bg-black border-l border-slate-900/50 shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.8)] flex-col
        `}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/5 via-black to-black -z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          
          {/* Translating Overlay */}
          {isTranslating && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
               <Loader2 size={32} className="text-red-600 animate-spin mb-4" />
               <p className="text-red-500 font-mono text-sm uppercase tracking-widest text-center px-4">Traduzindo Prompt...</p>
            </div>
          )}

          <Monitor 
            imageUrl={generatedImage} 
            script={state.lastGeneratedOutput ? JSON.stringify(state.lastGeneratedOutput, null, 2) : null}
            isLoading={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default App;