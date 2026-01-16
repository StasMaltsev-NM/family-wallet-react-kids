
import React, { useState, useRef } from 'react';
import { Wand2, Camera, Upload, RefreshCw, CheckCircle, Sparkles, Wand, Zap } from 'lucide-react';
import { AppTheme } from '../types';
import { editImage } from '../services/gemini';

interface ImageEditorProps {
  theme: AppTheme;
}

const STYLE_PRESETS = [
  { 
    id: 'roblox', 
    label: 'Роблокс', 
    icon: '🤖', 
    color: '#00A2FF',
    prompt: 'Transform this photo into a 3D blocky Roblox character and world. Use bright colors, plastic-like textures, and chunky blocky shapes. Make it look exactly like a Roblox game screenshot.' 
  },
  { 
    id: 'ghibli', 
    label: 'Гибли', 
    icon: '🌳', 
    color: '#4CAF50',
    prompt: 'Redraw this image in the iconic Studio Ghibli anime style. Use soft hand-painted watercolor textures, lush greenery, a nostalgic and magical atmosphere, inspired by Hayao Miyazaki films.' 
  },
  { 
    id: 'anime', 
    label: 'Аниме', 
    icon: '✨', 
    color: '#E91E63',
    prompt: 'Convert this photo into a vibrant modern high-quality anime style. Use sharp line art, dramatic cinematic lighting, expressive eyes, and saturated colors. Make it look like a scene from a top-tier anime.' 
  },
  { 
    id: 'minecraft', 
    label: 'Майнкрафт', 
    icon: '🧱', 
    color: '#795548',
    prompt: 'Pixelate this entire image into a 3D Minecraft world made of cubes (voxels). Use 8-bit textures, blocky characters, and the classic green and brown aesthetic of Minecraft landscapes.' 
  },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ theme }) => {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setEditedImage(null);
        setPrompt('');
        setActivePreset(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async (customPrompt?: string, presetId?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!image || !finalPrompt) return;
    
    setIsProcessing(true);
    if (presetId) setActivePreset(presetId);
    
    const result = await editImage(image, finalPrompt);
    
    if (result) {
      setEditedImage(result);
    } else {
      alert("Магия временно устала! Попробуй еще раз через минуту.");
    }
    
    setIsProcessing(false);
    setActivePreset(null);
  };

  const reset = () => {
    setImage(null);
    setEditedImage(null);
    setPrompt('');
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col pt-8 pb-32 px-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-black italic uppercase leading-tight" style={{ color: theme.text }}>
          Магическая <br />
          <span style={{ color: theme.accent }}>Линза</span>
        </h1>
        <p className="opacity-40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Преврати фото в приключение!</p>
      </div>

      {!image ? (
        <div 
          className="flex flex-col items-center justify-center space-y-8 p-12 rounded-[48px] border-4 border-dashed transition-all duration-500"
          style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: theme.surface }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse" />
            <div className="relative p-10 rounded-full bg-white/5 border-2 border-white/5 shadow-inner">
              <Camera size={64} className="opacity-20" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-black uppercase text-xl italic">Загрузи реальность</h3>
            <p className="text-[10px] opacity-40 font-bold uppercase">Мы добавим в неё немного магии</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glossy-btn w-full py-6 rounded-[24px] font-black uppercase text-sm flex items-center justify-center space-x-3 shadow-2xl transition-all active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <Upload size={24} />
            <span>Выбрать фото</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          {/* Main Display */}
          <div className="relative group rounded-[40px] overflow-hidden border-[6px] transition-all duration-700" 
               style={{ 
                 borderColor: isProcessing ? theme.secondary : theme.accent,
                 boxShadow: isProcessing ? `0 0 80px ${theme.secondary}88` : `0 20px 60px ${theme.shadow}`
               }}>
            <img 
              src={editedImage || image} 
              alt="Preview" 
              className="w-full aspect-square object-cover" 
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 z-10 animate-in fade-in duration-300">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-white/20 blur-3xl animate-pulse rounded-full" />
                  <RefreshCw size={80} className="animate-spin text-white opacity-80" />
                  <Sparkles size={40} className="absolute -top-4 -right-4 animate-bounce" style={{ color: theme.accent }} />
                </div>
                <h4 className="font-black uppercase tracking-[0.3em] text-2xl mb-4" style={{ color: theme.accent }}>Колдуем...</h4>
                <div className="flex space-x-2">
                   {[0, 1, 2].map(i => (
                     <div key={i} className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                   ))}
                </div>
              </div>
            )}
            
            {editedImage && !isProcessing && (
              <div className="absolute top-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in zoom-in-50">
                <CheckCircle size={32} />
              </div>
            )}
          </div>

          {/* STYLE PRESETS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 ml-2">
               <Zap size={16} className="text-yellow-400" />
               <h3 className="text-[11px] font-black uppercase opacity-60 tracking-[0.2em]">Выбери игровой мир:</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    disabled={isProcessing}
                    onClick={() => {
                      setPrompt(preset.prompt);
                      handleEdit(preset.prompt, preset.id);
                    }}
                    className={`relative p-6 rounded-[32px] border-4 transition-all duration-300 flex flex-col items-center justify-center space-y-3 overflow-hidden group ${
                      isProcessing && !isSelected ? 'opacity-30 grayscale pointer-events-none' : 'hover:scale-[1.05] active:scale-95'
                    } ${isSelected ? 'animate-pulse-slow' : ''}`}
                    style={{ 
                      backgroundColor: theme.surface,
                      borderColor: isSelected ? preset.color : 'rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? `0 0 40px ${preset.color}66` : 'none'
                    }}
                  >
                    <div 
                      className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-3xl opacity-20"
                      style={{ backgroundColor: preset.color }}
                    />
                    
                    <span className={`text-5xl transition-all duration-500 ${isSelected ? 'scale-125 rotate-12' : 'group-hover:scale-110'}`}>
                      {preset.icon}
                    </span>
                    <span className="text-[14px] font-black uppercase tracking-tight" style={{ color: isSelected ? preset.color : theme.text }}>
                      {preset.label}
                    </span>

                    {isSelected && isProcessing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                         <RefreshCw className="animate-spin" style={{ color: preset.color }} size={24} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-4 pt-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase opacity-40 block mb-2 ml-2 tracking-widest italic">Твой секретный промпт:</label>
              <div className="relative">
                <input 
                  type="text" 
                  disabled={isProcessing}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (activePreset) setActivePreset(null);
                  }}
                  placeholder="напр. Сделай меня супергероем..."
                  className="w-full p-6 rounded-[28px] bg-white/5 border-2 transition-all font-bold text-base focus:outline-none"
                  style={{ 
                    borderColor: prompt && !activePreset ? theme.accent : 'rgba(255,255,255,0.1)',
                    color: theme.text 
                  }}
                />
                <Wand2 size={24} className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all ${prompt ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} style={{ color: theme.accent }} />
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={reset}
                disabled={isProcessing}
                className="flex-1 py-6 rounded-[28px] font-black uppercase text-xs bg-white/5 hover:bg-white/10 transition-all border-2 border-white/5 opacity-50 hover:opacity-100"
              >
                Очистить
              </button>
              <button 
                onClick={() => handleEdit()}
                disabled={!prompt || isProcessing}
                className={`flex-[2] glossy-btn py-6 rounded-[28px] font-black uppercase text-sm flex items-center justify-center space-x-3 shadow-2xl transition-all ${
                  (!prompt || isProcessing) ? 'opacity-30' : 'hover:scale-[1.02] active:scale-95'
                }`}
                style={{ 
                  backgroundColor: theme.accent, 
                  color: theme.bg,
                }}
              >
                <Zap size={20} />
                <span>Запуск Магии</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.03); filter: brightness(1.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ImageEditor;
