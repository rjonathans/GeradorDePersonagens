import React, { useState, useRef } from 'react';
import { Settings, User, Video, ChevronDown, ChevronRight, Zap, Edit3, Plus, Trash2, Image as ImageIcon, Film, MonitorPlay, Sparkles, MessageSquare, Upload, X, Wand2 } from 'lucide-react';
import { StudioState, CharacterDNA, SceneData } from '../types';
import { describeImage } from '../services/geminiService';

interface ControlPanelProps {
  state: StudioState;
  onUpdate: (newState: StudioState) => void;
  onGenerateJSON: (type: 'image' | 'video') => void;
  onRenderImage: (aspectRatio: "1:1" | "16:9" | "9:16") => void;
  isGenerating: boolean;
  apiKey?: string;
}

const STYLE_OPTIONS = [
  "photorealistic", "Tech-noir cinematic atmosphere", "high detail", "sharp edges", 
  "dramatic lighting", "deep shadows", "realistic digital art",
  "Painted Anime", "Casual Photo", "Cinematic", "Digital Painting", "Concept Art",
  "3D Disney Character", "2D Disney Character", "Disney Sketch", "Concept Sketch",
  "Painterly", "Oil Painting", "Oil Painting - Realism", "Oil Painting - Old",
  "Oil Painting - 70s Pulp", "Professional Photo", "Anime", "Drawn Anime",
  "Anime Screencap", "Cute Anime", "Soft Anime", "Fantasy Painting",
  "Fantasy Landscape", "Fantasy Portrait", "Studio Ghibli", "50s Enamel Sign",
  "Vintage Comic", "Franco-Belgian Comic", "Tintin Comic", "Medieval", "Pixel Art",
  "Furry - Oil", "Furry - Cinematic", "Furry - Painted", "Furry - Drawn",
  "Cute Figurine", "3D Emoji", "Illustration", "Cute Illustration", "Flat Illustration",
  "Watercolor", "1990s Photo", "1980s Photo", "1970s Photo", "1960s Photo",
  "1950s Photo", "1940s Photo", "1930s Photo", "1920s Photo", "Vintage Pulp Art",
  "50s Infomercial Anime", "3D Pokemon", "Painted Pokemon", "2D Pokemon",
  "Vintage Anime", "Neon Vintage Anime", "Manga", "Fantasy World Map",
  "Fantasy City Map", "Old World Map", "3D Isometric Icon", "Flat Style Icon",
  "Flat Style Logo", "Game Art Icon", "Digital Painting Icon", "Concept Art Icon",
  "Cute 3D Icon", "Cute 3D Icon Set", "Crayon Drawing", "Pencil", "Tattoo Design",
  "Waifu", "YuGiOh Art", "Traditional Japanese", "Nihonga Painting", "Claymation",
  "Cartoon", "Cursed Photo", "MTG Card"
];

const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, isOpen, onToggle, children, className }) => (
  <div className={`border-b border-slate-900/50 ${className}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-slate-300 hover:text-white transition-colors group"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-bold text-sm tracking-wide text-red-500/80 group-hover:text-red-500 uppercase">{title}</span>
      </div>
      {isOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
    </button>
    {isOpen && <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
}> = ({ label, value, onChange, multiline, rows = 3 }) => (
  <div className="group">
    <label className="block text-xs font-bold text-red-500/70 mb-2 uppercase tracking-wider group-hover:text-red-400 transition-colors">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none transition-all resize-y placeholder-slate-700"
        placeholder={`Inserir ${label.toLowerCase()}...`}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none transition-all placeholder-slate-700"
        placeholder={`Inserir ${label.toLowerCase()}...`}
      />
    )}
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, onUpdate, onGenerateJSON, onRenderImage, isGenerating, apiKey }) => {
  const [sections, setSections] = useState({
    visuals: true,
    scene: true,
    advanced: false,
    details: true
  });
  const [selectedRatio, setSelectedRatio] = useState<"9:16" | "1:1" | "16:9">("16:9");
  
  // Loading states
  const [isDescribingGeneral, setIsDescribingGeneral] = useState(false);
  const [isDescribingChar, setIsDescribingChar] = useState(false);

  // Refs for file inputs
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const charFileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (key: keyof typeof sections) => setSections(p => ({ ...p, [key]: !p[key] }));

  const updateDNA = (key: keyof CharacterDNA, value: string) => {
    const newDNA = { ...state.character_dna, [key]: value };
    onUpdate({ ...state, character_dna: newDNA });
  };

  const updateScene = (key: keyof SceneData, value: string) => {
    const newScene = { ...state.scene, [key]: value };
    onUpdate({ ...state, scene: newScene });
  };

  const handleStyleClick = (style: string) => {
    const current = state.character_dna.visual_style || "";
    let updated = current.trim();
    
    if (updated.length === 0) {
      updated = `Style: ${style}`;
    } else {
      if (!updated.endsWith(',') && !updated.endsWith('.')) {
        updated += ',';
      }
      updated += ` ${style}`;
    }
    updateDNA('visual_style', updated);
  };

  // Handlers for Visual Reference (General)
  const handleGeneralImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ ...state, referenceImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };
  const clearGeneralImage = () => {
    onUpdate({ ...state, referenceImage: null });
    if (generalFileInputRef.current) generalFileInputRef.current.value = "";
  };
  const handleDescribeGeneral = async () => {
    if (!state.referenceImage) return;
    setIsDescribingGeneral(true);
    try {
      const analysis = await describeImage(state.referenceImage, 'general', apiKey);
      onUpdate({ ...state, character_dna: { ...state.character_dna, ...analysis } });
    } catch (error) {
      alert("Falha ao analisar imagem. Verifique sua API Key.");
    } finally {
      setIsDescribingGeneral(false);
    }
  };

  // Handlers for Character Reference
  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ ...state, characterReferenceImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };
  const clearCharImage = () => {
    onUpdate({ ...state, characterReferenceImage: null });
    if (charFileInputRef.current) charFileInputRef.current.value = "";
  };
  const handleDescribeChar = async () => {
    if (!state.characterReferenceImage) return;
    setIsDescribingChar(true);
    try {
      const analysis = await describeImage(state.characterReferenceImage, 'character_only', apiKey);
      onUpdate({ 
        ...state, 
        character_dna: { 
          ...state.character_dna, 
          base_description: analysis.base_description || state.character_dna.base_description,
          face: analysis.face || state.character_dna.face,
          eyes: analysis.eyes || state.character_dna.eyes,
          clothes: analysis.clothes || state.character_dna.clothes,
          body: analysis.body || state.character_dna.body
        } 
      });
    } catch (error) {
      alert("Falha ao analisar personagem. Verifique sua API Key.");
    } finally {
      setIsDescribingChar(false);
    }
  };


  return (
    <div className="h-full flex flex-col bg-[#020202] w-full flex-shrink-0 relative z-20 shadow-2xl shadow-black md:border-r border-slate-900">
      <div className="p-6 border-b border-slate-900 bg-[#020202]">
        <h1 className="text-xl font-black tracking-tight text-red-600 mb-1">
          Gerador de Personagens
        </h1>
        <div className="h-0.5 w-1/3 bg-gradient-to-r from-red-600 to-transparent opacity-50"></div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-20 md:pb-0">
        
        {/* Primary Visual Controls */}
        <Section
          title="Elementos Visuais"
          icon={<Edit3 size={16} />}
          isOpen={sections.visuals}
          onToggle={() => toggle('visuals')}
        >
           {/* General/Setting Reference Image Upload */}
           <div className="mb-4">
             <label className="block text-xs font-bold text-red-500/70 mb-2 uppercase tracking-wider">
               Ref. de Cenário/Estilo
             </label>
             
             {!state.referenceImage ? (
               <div 
                 onClick={() => generalFileInputRef.current?.click()}
                 className="border border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-900/50 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
               >
                 <Upload size={20} className="mb-2" />
                 <span className="text-[10px]">Upload Cenário</span>
               </div>
             ) : (
               <div className="relative border border-slate-800 rounded-lg overflow-hidden group">
                 <img src={state.referenceImage} alt="Ref" className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                 <button 
                   onClick={clearGeneralImage}
                   className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors"
                 >
                   <X size={12} />
                 </button>
                 
                 <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 backdrop-blur-sm border-t border-slate-800">
                   <button
                     onClick={handleDescribeGeneral}
                     disabled={isDescribingGeneral}
                     className="w-full py-1 rounded bg-red-900/30 border border-red-900/50 text-red-400 text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-red-900/50 hover:text-red-300 transition-all"
                   >
                     {isDescribingGeneral ? <Zap size={10} className="animate-spin" /> : <Wand2 size={10} />}
                     {isDescribingGeneral ? '...' : 'Analisar Tudo'}
                   </button>
                 </div>
               </div>
             )}
             <input 
               type="file" 
               ref={generalFileInputRef} 
               onChange={handleGeneralImageUpload} 
               accept="image/*" 
               className="hidden" 
             />
           </div>

          <InputField 
            label="Cenário" 
            value={state.character_dna.setting} 
            onChange={(v) => updateDNA('setting', v)} 
            multiline 
            rows={4}
          />
          
          {/* Style Presets and Input */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-xs font-bold text-red-500/70 uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Biblioteca de Estilos</span>
             </div>
             <div className="h-48 overflow-y-auto pr-2 grid grid-cols-2 gap-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent border border-slate-900/50 rounded-lg p-2 bg-[#050505]">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleClick(style)}
                    className="px-2 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-[10px] font-bold uppercase transition-all text-center whitespace-normal h-auto min-h-[36px] flex items-center justify-center leading-tight"
                    title={style}
                  >
                    {style}
                  </button>
                ))}
             </div>
             <InputField 
              label="Estilo Visual" 
              value={state.character_dna.visual_style} 
              onChange={(v) => updateDNA('visual_style', v)} 
              multiline 
              rows={3}
            />
          </div>
        </Section>

        {/* Scene Data */}
        <Section
          title="Dados da Cena"
          icon={<Video size={16} />}
          isOpen={sections.scene}
          onToggle={() => toggle('scene')}
        >
          <InputField 
            label="Ação da Cena"
            value={state.scene.action} 
            onChange={(v) => updateScene('action', v)} 
            multiline 
            rows={3}
          />
          
          <div className="pt-2 space-y-4">
             <div className="flex items-center gap-2 text-xs font-bold text-red-500/70 uppercase tracking-wider">
                <MessageSquare size={12} />
                <span>Diálogos</span>
             </div>
             
             <InputField 
              label="Diálogo 1" 
              value={state.scene.dialogue1} 
              onChange={(v) => updateScene('dialogue1', v)} 
              multiline
              rows={2}
            />
            <InputField 
              label="Diálogo 2" 
              value={state.scene.dialogue2} 
              onChange={(v) => updateScene('dialogue2', v)} 
              multiline
              rows={2}
            />
            <InputField 
              label="Diálogo 3" 
              value={state.scene.dialogue3} 
              onChange={(v) => updateScene('dialogue3', v)} 
              multiline
              rows={2}
            />
          </div>
        </Section>

        {/* Detailed Character DNA */}
        <Section
          title="Detalhes do Personagem"
          icon={<User size={16} />}
          isOpen={sections.details}
          onToggle={() => toggle('details')}
        >
           {/* Character Reference Image Upload */}
           <div className="mb-4">
             <label className="block text-xs font-bold text-red-500/70 mb-2 uppercase tracking-wider">
               Ref. de Personagem
             </label>
             <p className="text-[10px] text-slate-500 mb-2">Use se o cenário acima não contiver o personagem.</p>
             
             {!state.characterReferenceImage ? (
               <div 
                 onClick={() => charFileInputRef.current?.click()}
                 className="border border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-900/50 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
               >
                 <Upload size={20} className="mb-2" />
                 <span className="text-[10px]">Upload Personagem</span>
               </div>
             ) : (
               <div className="relative border border-slate-800 rounded-lg overflow-hidden group">
                 <img src={state.characterReferenceImage} alt="Char Ref" className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                 <button 
                   onClick={clearCharImage}
                   className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors"
                 >
                   <X size={12} />
                 </button>
                 
                 <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 backdrop-blur-sm border-t border-slate-800">
                   <button
                     onClick={handleDescribeChar}
                     disabled={isDescribingChar}
                     className="w-full py-1 rounded bg-red-900/30 border border-red-900/50 text-red-400 text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-red-900/50 hover:text-red-300 transition-all"
                   >
                     {isDescribingChar ? <Zap size={10} className="animate-spin" /> : <Wand2 size={10} />}
                     {isDescribingChar ? '...' : 'Analisar Personagem'}
                   </button>
                 </div>
               </div>
             )}
             <input 
               type="file" 
               ref={charFileInputRef} 
               onChange={handleCharImageUpload} 
               accept="image/*" 
               className="hidden" 
             />
           </div>

           <InputField label="Descrição Base" value={state.character_dna.base_description} onChange={(v) => updateDNA('base_description', v)} multiline rows={4} />
           <InputField label="Rosto" value={state.character_dna.face} onChange={(v) => updateDNA('face', v)} multiline />
           <InputField label="Olhos" value={state.character_dna.eyes} onChange={(v) => updateDNA('eyes', v)} />
           <InputField label="Roupas" value={state.character_dna.clothes} onChange={(v) => updateDNA('clothes', v)} />
           <InputField label="Corpo" value={state.character_dna.body} onChange={(v) => updateDNA('body', v)} />
        </Section>
      </div>

      {/* ACTION FOOTER */}
      <div className="p-4 border-t border-slate-900 bg-[#020202] space-y-4">
        
        {/* Row 1: Generate Prompt Buttons (JSON Only) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onGenerateJSON('image')}
            className="py-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <ImageIcon size={14} />
            Prompt Imagem
          </button>
          <button
            onClick={() => onGenerateJSON('video')}
            className="py-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Film size={14} />
            Prompt Vídeo
          </button>
        </div>

        <div className="h-px bg-slate-900 w-full my-2"></div>

        {/* Row 2 & 3: Real Image Generation */}
        <div className="space-y-3">
           {/* Aspect Ratio Selector */}
           <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900">
              {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`py-1.5 text-[10px] font-mono rounded transition-all ${
                    selectedRatio === ratio 
                      ? 'bg-slate-800 text-red-500 font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {ratio}
                </button>
              ))}
           </div>

           <button
            onClick={() => onRenderImage(selectedRatio)}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-lg font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 ${
              isGenerating 
                ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800' 
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.7)]'
            }`}
          >
            {isGenerating ? (
              <>
                <Zap size={18} className="animate-spin" />
                Renderizando...
              </>
            ) : (
              <>
                <MonitorPlay size={18} />
                Gerar Imagem Real
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};