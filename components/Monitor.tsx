import React, { useState } from 'react';
import { Maximize2, Code2, Terminal, Copy, Check, Download } from 'lucide-react';

interface MonitorProps {
  imageUrl: string | null;
  script: string | null;
  isLoading: boolean;
}

export const Monitor: React.FC<MonitorProps> = ({ imageUrl, script, isLoading }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `cltube_render_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-10 gap-4 md:gap-8 pt-4 md:pt-10 overflow-y-auto">
      
      {/* Right Side Header */}
      <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-950/50 p-2 rounded-lg border border-red-900/50 text-red-500">
            <Code2 size={20} />
          </div>
          <div>
             <h2 className="text-red-500 font-bold text-base md:text-lg tracking-wide">Saída do Prompt</h2>
             <p className="text-slate-500 text-[10px] md:text-xs">Visualização em tempo real do output</p>
          </div>
        </div>
        <div className="flex gap-2">
           <span className="px-2 py-1 bg-slate-900 rounded text-[10px] text-slate-500 font-mono border border-slate-800 hidden md:inline-block">GEMINI-2.5-FLASH</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Video/Image Monitor */}
        <div className="flex-[2] bg-black rounded-xl border border-slate-900 shadow-2xl overflow-hidden relative group ring-1 ring-white/5 min-h-[300px] lg:min-h-0">
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
            {isLoading ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-red-600 font-mono text-xs animate-pulse uppercase tracking-widest">Renderizando Cena...</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Generated Scene" 
                className="w-full h-full object-contain"
              />
            ) : (
               <div className="text-slate-800 flex flex-col items-center gap-4">
                  <Maximize2 size={48} strokeWidth={1} />
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-700">Aguardando Imagem</span>
               </div>
            )}
          </div>

          {/* Overlays */}
          <div className="absolute top-4 left-4 pointer-events-none">
             <div className="flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1 rounded border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-red-600'}`}></div>
                <span className="text-[10px] font-bold text-white tracking-widest">REC</span>
             </div>
          </div>

          {/* Download Button */}
          {imageUrl && !isLoading && (
             <div className="absolute bottom-4 right-4 z-10">
               <button 
                 onClick={handleDownload}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-950/90 hover:bg-red-600 border border-slate-800 hover:border-red-500 text-slate-200 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-lg group/btn cursor-pointer"
               >
                 <Download size={16} className="group-hover/btn:translate-y-0.5 transition-transform" />
                 <span className="text-xs font-bold tracking-wider uppercase">Download</span>
               </button>
             </div>
          )}
        </div>

        {/* Script/JSON Output Area */}
        <div className="flex-1 flex flex-col bg-[#050505] rounded-xl border border-slate-900 ring-1 ring-white/5 overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="bg-slate-950/50 p-3 border-b border-slate-900 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
               <Terminal size={12} />
               JSON OUTPUT
            </span>
            
            <div className="flex items-center gap-3">
              {script && <span className="text-[10px] text-green-500 hidden md:inline-block">● Atualizado</span>}
              
              {/* Copy Button */}
              {script && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all group cursor-pointer"
                  title="Copiar JSON"
                >
                  {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  <span className={`text-[10px] font-bold uppercase ${isCopied ? 'text-green-500' : ''}`}>
                    {isCopied ? 'Copiado' : 'Copiar'}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
             {script ? (
               <pre className="text-red-400 text-xs whitespace-pre-wrap break-all leading-relaxed">
                 {script}
               </pre>
             ) : (
               <div className="text-slate-700 italic text-xs text-center mt-10">
                 Seu prompt JSON gerado aparecerá aqui.
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};