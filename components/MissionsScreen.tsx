
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star, Clock, Lock, Sparkles, Wallet, TrendingUp } from 'lucide-react';
import { Task, TaskStatus, AppTheme } from '../types';

interface MissionsScreenProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  theme: AppTheme;
  currencyIcon: string;
  balance: number;
  pendingBalance: number;
}

const GOLD_COLOR = '#FFD700'; 

const MissionsScreen: React.FC<MissionsScreenProps> = ({ 
  tasks, 
  onComplete, 
  theme, 
  currencyIcon,
  balance,
  pendingBalance
}) => {
  const [isPendingBumping, setIsPendingBumping] = useState(false);

  useEffect(() => {
    if (pendingBalance > 0) {
      setIsPendingBumping(true);
      const timer = setTimeout(() => setIsPendingBumping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [pendingBalance]);

  return (
    <div className="flex flex-col pt-8 pb-32 px-6 min-h-screen">
      <div className="mb-10 relative flex justify-between items-start">
        {/* Title Section (Left) */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full blur-2xl animate-pulse" />
          <h1 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tighter" style={{ color: theme.text }}>
            Твои <br />
            <span style={{ color: theme.accent }}>Миссии</span>
          </h1>
        </div>

        {/* Indicators Section (Right) */}
        <div className="flex flex-col items-end space-y-3 pt-1">
          <div 
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl border-2 bg-black/40 backdrop-blur-md transition-all duration-300"
            style={{ borderColor: theme.accent, boxShadow: `0 4px 15px ${theme.accent}33` }}
          >
            <Wallet size={14} style={{ color: theme.accent }} />
            <span className="font-black text-base leading-none tracking-tight">
              {balance} <span className="text-[10px] opacity-70">{currencyIcon}</span>
            </span>
          </div>

          <div 
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border-2 border-dashed bg-orange-500/10 transition-all duration-500 ${
              isPendingBumping ? 'scale-110 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'scale-100'
            }`}
            style={{ 
              borderColor: pendingBalance > 0 ? 'rgba(249, 115, 22, 0.6)' : 'rgba(255,255,255,0.05)',
              opacity: pendingBalance > 0 ? 1 : 0.3
            }}
          >
            <TrendingUp size={12} className={pendingBalance > 0 ? "text-orange-400 animate-bounce" : "text-gray-500"} />
            <div className="flex flex-col items-end">
              <span className="text-[6px] font-black uppercase opacity-60 leading-none mb-0.5">В пути</span>
              <span className="font-black text-xs text-orange-400 leading-none">
                +{pendingBalance} {currencyIcon}
              </span>
            </div>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-20 px-8 rounded-[40px] border-4 border-dashed text-center space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: theme.surface }}
        >
          <div className="p-6 rounded-full bg-white/5">
            <Sparkles size={48} className="opacity-20" />
          </div>
          <div>
            <h3 className="font-black uppercase text-xl italic opacity-40">Всё сделано!</h3>
            <p className="text-[10px] opacity-20 font-bold uppercase tracking-widest mt-1">Жди новых заданий от родителей</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {tasks.map((task) => {
            const isWaiting = task.status === TaskStatus.WAITING;
            const isConfirmed = task.status === TaskStatus.CONFIRMED;
            const rewardColor = isConfirmed ? 'rgba(255,255,255,0.2)' : (isWaiting ? theme.accent : GOLD_COLOR);

            return (
              <div 
                key={task.id}
                className={`group relative overflow-hidden p-6 rounded-[35px] border-2 border-b-[10px] transition-all duration-500 ${
                  isConfirmed ? 'opacity-40 grayscale scale-[0.98]' : 'hover:scale-[1.02] active:scale-95'
                }`}
                style={{ 
                  backgroundColor: theme.surface,
                  borderColor: isConfirmed ? 'rgba(255,255,255,0.05)' : rewardColor,
                  boxShadow: isConfirmed ? 'none' : `0 15px 35px ${rewardColor}15`
                }}
              >
                <div className="absolute -bottom-6 -right-6 opacity-[0.05] rotate-12 pointer-events-none transition-transform group-hover:rotate-45 duration-1000">
                  <Star size={140} fill="white" />
                </div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center space-x-5">
                    <div 
                      className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-4xl shrink-0 transition-all duration-500 ${isWaiting ? 'animate-pulse' : 'group-hover:rotate-12'}`}
                      style={{ 
                        backgroundColor: `${rewardColor}15`,
                        border: `2px solid ${rewardColor}33`,
                        boxShadow: isConfirmed ? 'none' : `inset 0 0 15px ${rewardColor}22`
                      }}
                    >
                      {task.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">{task.title}</h3>
                      <p className="text-[11px] opacity-50 font-bold uppercase leading-tight max-w-[160px]">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] font-black uppercase opacity-30 mb-1">Награда</div>
                    <div className="flex items-center font-black text-3xl italic" style={{ color: rewardColor }}>
                      <span className="text-base mr-1">+</span>
                      {task.reward}
                      <span className="ml-1 text-xl">{currencyIcon}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
{task.status === TaskStatus.IDLE ? (
  <button
    onClick={() => onComplete(task.id)}
    className="w-full glossy-btn py-5 rounded-[22px] font-black text-lg uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 flex items-center justify-center space-x-3"
    style={{
      backgroundColor: theme.accent,
      color: theme.bg,
      boxShadow: `0 8px 0 ${theme.secondary}CC, 0 15px 30px ${theme.accent}44`,
    }}
  >
    <CheckCircle2 size={26} />
    <span>Я ЭТО СДЕЛАЛ!</span>
  </button>
) : task.status === TaskStatus.WAITING ? (
  <div
    className="w-full py-5 rounded-[22px] flex items-center justify-center space-x-3 border-4 border-dashed font-black uppercase text-sm animate-pulse transition-all duration-500"
    style={{ borderColor: theme.accent, color: theme.accent }}
  >
    <Clock size={22} />
    <span>Ждём одобрения...</span>
  </div>
) : (
  <div className="w-full py-4 rounded-2xl bg-white/5 text-center font-black opacity-30 uppercase text-[11px] tracking-[0.4em] flex items-center justify-center space-x-2">
    <Lock size={16} />
    <span>Миссия выполнена</span>
  </div>
)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!tasks.every(t => t.status === TaskStatus.CONFIRMED) && (
        <div className="mt-12 p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
             <Star size={24} fill="currentColor" />
           </div>
           <p className="text-[10px] font-black uppercase opacity-50 leading-snug">
             Круто! Каждая миссия <br />
             приближает тебя к <span style={{ color: theme.accent }}>ТВОЕЙ МЕЧТЕ!</span>
           </p>
        </div>
      )}

      <style>{`
        @keyframes bump {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-bump {
          animation: bump 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MissionsScreen;
