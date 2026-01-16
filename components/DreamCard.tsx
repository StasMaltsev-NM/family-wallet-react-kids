
import React, { useState, useEffect } from 'react';
import { Target, Trash2, Rocket, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppTheme, Dream } from '../types';

interface DreamCardProps {
  dream: Dream;
  balance: number;
  theme: AppTheme;
  onSaveDream: (title: string, goal: number) => void;
  onDeleteDream: () => void;
  onClaimDream?: () => void;
}

const DreamCard: React.FC<DreamCardProps> = ({ dream, balance, theme, onSaveDream, onDeleteDream, onClaimDream }) => {
  const [inputTitle, setInputTitle] = useState('');
  
  const progress = dream.goal > 0 ? Math.min((balance / dream.goal) * 100, 100) : 0;
  const isReached = progress >= 100 && dream.status === 'ACTIVE';

  useEffect(() => {
    if (isReached) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#FFD700', '#FFFFFF', theme.accent]
      });
    }
  }, [isReached]);

  const handleStart = () => {
    if (inputTitle.trim()) {
      onSaveDream(inputTitle, 1000);
      setInputTitle('');
    }
  };

  if (dream.status === 'NONE') {
    return (
      <div 
        className="w-full p-8 rounded-[40px] border-2 bg-black/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500"
        style={{ borderColor: 'rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
      >
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-white/5">
              <Star size={20} className="text-yellow-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Какая твоя мечта?</h3>
          </div>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="Напиши, что ты хочешь..."
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 text-base font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white placeholder:opacity-20"
            />
          </div>

          <button 
            onClick={handleStart}
            disabled={!inputTitle.trim()}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all ${
              inputTitle.trim() ? 'active:scale-95 shadow-lg' : 'opacity-20 grayscale'
            }`}
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <Rocket size={20} />
            <span>УСТАНОВИТЬ ЦЕЛЬ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full p-6 rounded-[40px] border-4 relative overflow-hidden group transition-all duration-700 animate-in slide-in-from-top-4"
      style={{ 
        borderColor: isReached ? '#FFD700' : theme.accent, 
        backgroundColor: theme.surface,
        boxShadow: isReached ? '0 15px 50px rgba(255, 215, 0, 0.3)' : `0 15px 40px ${theme.shadow}`
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDeleteDream();
        }}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all z-20"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
            {dream.icon || '🚀'}
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic leading-none truncate max-w-[180px]">
              {dream.title}
            </h3>
            <p className="text-[9px] font-black uppercase opacity-40 mt-1 tracking-[0.2em]">Твоя главная мечта</p>
          </div>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="flex justify-between text-[10px] font-black uppercase mb-2 opacity-50 tracking-widest">
          <span>Прогресс</span>
          <span style={{ color: '#FFD700' }} className="text-sm font-black italic">{Math.round(progress)}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-black/40 overflow-hidden p-1 border border-white/10 shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-1000 relative"
            style={{ 
              width: `${progress}%`,
              background: isReached 
                ? 'linear-gradient(90deg, #FFA500, #FFD700)' 
                : `linear-gradient(90deg, ${theme.secondary}, ${theme.accent})`,
            }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center bg-black/30 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center space-x-2">
          <Target size={18} className="text-white" />
          <span className="text-lg font-black italic text-white uppercase">{balance} / {dream.goal} ⭐</span>
        </div>
        {isReached && <div className="text-[10px] font-black uppercase text-[#FFD700] animate-pulse">ГОТОВО!</div>}
      </div>

      {isReached && (
        <button 
          onClick={onClaimDream}
          className="mt-4 w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase tracking-[0.3em] text-[10px] animate-bounce shadow-[0_10px_30px_rgba(255,215,0,0.4)]"
        >
          ПОЛУЧИТЬ ПРИЗ 🏆
        </button>
      )}
    </div>
  );
};

export default DreamCard;
