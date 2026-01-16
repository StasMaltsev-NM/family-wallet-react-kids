
import React from 'react';
import { AppTheme } from '../types';

interface AvatarProps {
  theme: AppTheme;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ theme, size = 180 }) => {
  return (
    <div className="relative flex flex-col items-center group cursor-pointer active:scale-95 transition-transform duration-300">
      {/* Магическое свечение под ногами (Аура / Тень) */}
      <div 
        className="absolute -bottom-2 w-44 h-12 rounded-[100%] blur-3xl opacity-40 animate-pulse transition-all duration-700 group-hover:opacity-60"
        style={{ backgroundColor: theme.accent }}
      />
      <div 
        className="absolute -bottom-1 w-36 h-6 rounded-[100%] opacity-20 blur-xl"
        style={{ backgroundColor: theme.accent }}
      />
      <div 
        className="absolute bottom-1 w-28 h-4 rounded-[100%] border-4 opacity-30"
        style={{ borderColor: theme.accent, backgroundColor: theme.accent }}
      />
      
      {/* Roblox-style Character Body */}
      <div className="relative z-10 animate-float drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
        <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Голова (Блочная) */}
          <rect x="35" y="5" width="30" height="30" rx="4" fill={theme.surface} stroke={theme.accent} strokeWidth="4"/>
          
          {/* Лицо / Глаза (Светятся цветом темы) */}
          <rect x="42" y="15" width="4" height="6" rx="1" fill={theme.accent} className="animate-pulse" />
          <rect x="54" y="15" width="4" height="6" rx="1" fill={theme.accent} className="animate-pulse" />
          <rect x="42" y="26" width="16" height="2" rx="1" fill={theme.accent} opacity="0.5" />

          {/* Аксессуар (Наушники геймера) */}
          <rect x="30" y="12" width="6" height="15" rx="2" fill={theme.accent} />
          <rect x="64" y="12" width="6" height="15" rx="2" fill={theme.accent} />
          <path d="M35 12C35 5 65 5 65 12" stroke={theme.accent} strokeWidth="3" />

          {/* Туловище (Массивное) */}
          <rect x="25" y="40" width="50" height="45" rx="6" fill={theme.surface} stroke={theme.accent} strokeWidth="4"/>
          {/* Логотип на груди */}
          <path d="M45 55L50 50L55 55L50 65L45 55Z" fill={theme.accent} className="animate-pulse" />

          {/* Руки (Квадратные) */}
          <rect x="10" y="42" width="12" height="35" rx="3" fill={theme.surface} stroke={theme.accent} strokeWidth="3.5"/>
          <rect x="78" y="42" width="12" height="35" rx="3" fill={theme.surface} stroke={theme.accent} strokeWidth="3.5"/>

          {/* Ноги (Массивные ступни) */}
          <rect x="30" y="88" width="16" height="25" rx="4" fill={theme.surface} stroke={theme.accent} strokeWidth="3.5"/>
          <rect x="54" y="88" width="16" height="25" rx="4" fill={theme.surface} stroke={theme.accent} strokeWidth="3.5"/>
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Avatar;
