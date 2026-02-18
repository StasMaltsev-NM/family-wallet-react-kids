
import React from 'react';
import { Trophy, Zap, Palette, Star, ChevronRight, Settings } from 'lucide-react';
import { AppTheme, ThemeId } from '../types';
import { BADGES } from '../constants';
import Avatar from './Avatar';
import { getBalanceSizeTier } from './balanceSizing';

interface ProfileScreenProps {
  name: string;
  lifetimeEarnings: number;
  completedCount: number;
  theme: AppTheme;
  currentThemeId: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  isParentMode: boolean;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  name, 
  lifetimeEarnings, 
  completedCount, 
  theme,
  currentThemeId,
  onThemeChange,
  isParentMode
}) => {
  // Уровневая система: 1 уровень за каждые 300 заработанных монет
  const xpPerLevel = 300;
  const currentLevel = Math.floor(lifetimeEarnings / xpPerLevel) + 1;
  const currentXP = lifetimeEarnings % xpPerLevel;
  const progressToNextLevel = (currentXP / xpPerLevel) * 100;
  const earningsTier = getBalanceSizeTier(Number(lifetimeEarnings || 0));
  const earningsValueClass =
    earningsTier === "tight" ? "text-[24px]" : earningsTier === "compact" ? "text-[27px]" : "text-3xl";

  const handleLogout = () => {
    if (confirm('Выйти из профиля?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const themeOptions = [
    { id: ThemeId.GAMER_BLUE, label: 'Геймер', preview: '#00E5FF', icon: '🔵' },
    { id: ThemeId.NEON_POP, label: 'Неон', preview: '#FF33CC', icon: '🟣' },
    { id: ThemeId.GOLDEN_TROPHY, label: 'Золото', preview: '#FFD700', icon: '🟡' }
  ];

  return (
    <div className="flex flex-col pt-4 pb-32 px-6 min-h-screen">
{/* Header with Settings */}
<div className="flex justify-between items-center mb-6">
  <div />
  
  <button 
    type="button"
    className="p-3 rounded-2xl bg-white/5 border border-white/5 opacity-60"
    aria-label="Настройки"
    onClick={handleLogout}
  >
    <Settings size={20} />
  </button>
</div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <Avatar theme={theme} />
        <h1 className="text-4xl font-black italic uppercase mt-4 tracking-tighter" style={{ color: theme.text }}>
          {isParentMode ? 'Родитель' : name}
        </h1>
        
        {/* XP Progress Bar */}
        {!isParentMode && (
          <div className="w-full max-w-[240px] mt-4">
            <div className="flex justify-between items-end mb-2">
               <span className="text-[10px] font-black uppercase opacity-40">Прогресс уровня</span>
               <span className="text-[10px] font-black uppercase" style={{ color: theme.accent }}>{currentXP} / {xpPerLevel} XP</span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
              <div 
                className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                style={{ width: `${progressToNextLevel}%`, backgroundColor: theme.accent }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div 
          className="p-6 rounded-[32px] border-b-8 transition-transform active:scale-95"
          style={{ borderColor: theme.secondary, backgroundColor: theme.surface }}
        >
          <div className="flex items-center space-x-2 mb-2 opacity-50">
            <Zap size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Доход</p>
          </div>
          <p className={`${earningsValueClass} font-black italic leading-none whitespace-nowrap`} style={{ color: theme.accent }}>
            {lifetimeEarnings}
          </p>
        </div>
        <div 
          className="p-6 rounded-[32px] border-b-8 transition-transform active:scale-95"
          style={{ borderColor: theme.accent, backgroundColor: theme.surface }}
        >
          <div className="flex items-center space-x-2 mb-2 opacity-50">
            <Star size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Миссии</p>
          </div>
          <p className="text-3xl font-black italic" style={{ color: theme.accent }}>{completedCount}</p>
        </div>
      </div>

      {/* Badges Section */}
      {!isParentMode && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center text-lg font-black uppercase italic">
              <Trophy size={20} className="mr-2" style={{ color: theme.accent }} />
              Достижения
            </h3>
            <ChevronRight size={16} className="opacity-30" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((badge, idx) => {
              const unlocked = completedCount >= (idx + 1) * 2;
              return (
                <div 
                  key={badge.id}
                  className={`relative flex flex-col items-center p-4 rounded-[24px] border-2 transition-all duration-500 overflow-hidden ${!unlocked ? 'opacity-20 grayscale' : 'hover:scale-105 shadow-xl'}`}
                  style={{ 
                    borderColor: unlocked ? theme.accent : 'rgba(255,255,255,0.05)',
                    backgroundColor: theme.surface,
                    boxShadow: unlocked ? `0 10px 20px ${theme.shadow}` : 'none'
                  }}
                >
                  <span className="text-3xl mb-1 z-10">{badge.icon}</span>
                  <span className="text-[8px] font-black text-center leading-tight uppercase z-10">{badge.name}</span>
                  {unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme Switcher (Skins) */}
      <div className="space-y-4">
        <h3 className="flex items-center text-lg font-black uppercase italic">
          <Palette size={20} className="mr-2" style={{ color: theme.accent }} />
          Скины приложения
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {themeOptions.map((opt) => {
            const isSelected = currentThemeId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onThemeChange(opt.id)}
                className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all duration-300 ${
                  isSelected ? 'scale-[1.02]' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: theme.surface,
                  borderColor: isSelected ? theme.accent : 'rgba(255,255,255,0.05)',
                  boxShadow: isSelected ? `0 8px 25px ${theme.shadow}` : 'none'
                }}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="text-left">
                    <p className="font-black uppercase text-sm leading-none">{opt.label}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Набор цветов для {opt.label.toLowerCase()}а</p>
                  </div>
                </div>
                <div 
                  className="w-10 h-10 rounded-full border-4"
                  style={{ backgroundColor: opt.preview, borderColor: isSelected ? 'white' : 'transparent' }}
                />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProfileScreen;
