
import React from 'react';
import { Check, X, Target, Info, Coins, Users } from 'lucide-react';
import { Task, TaskStatus, AppTheme, Dream } from '../types';

interface ParentDashboardProps {
  tasks: Task[];
  dream: Dream;
  theme: AppTheme;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string) => void;
  onApproveDream: (price: number) => void;
  balance: number;
  currencyName: string;
  currencyIcon: string;
  onUpdateCurrency: (name: string, icon: string) => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ 
  tasks, 
  dream, 
  theme, 
  onApproveTask, 
  onRejectTask,
  onApproveDream,
  balance,
  currencyName,
  currencyIcon,
  onUpdateCurrency
}) => {
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.WAITING);
  const [dreamPrice, setDreamPrice] = React.useState(1000);

  return (
    <div className="flex flex-col pt-8 pb-36 px-6 min-h-screen space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black italic uppercase leading-tight" style={{ color: theme.text }}>
            FAMILY <span style={{ color: theme.accent }}>CONTROL</span>
          </h1>
          <p className="opacity-40 font-bold uppercase text-[10px] tracking-widest">Твой командный центр</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <Users size={24} className="opacity-40" />
        </div>
      </div>

      {/* Child Selector Simulation */}
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {['Артем', 'София'].map((name, i) => (
          <div key={name} className="flex flex-col items-center space-y-2 shrink-0">
             <div 
              className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center text-2xl transition-all ${
                i === 0 ? 'border-emerald-500 shadow-[0_0_20px_#10B981]' : 'border-white/10 opacity-40 grayscale'
              } ${i === 0 && pendingTasks.length > 0 ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: theme.surface }}
             >
               {i === 0 ? '👾' : '🦄'}
             </div>
             <span className={`text-[10px] font-black uppercase ${i === 0 ? 'text-emerald-500' : 'opacity-40'}`}>{name}</span>
          </div>
        ))}
      </div>

      {/* Missions Queue */}
      <div className="space-y-6">
        <h3 className="text-lg font-black uppercase italic flex items-center tracking-tighter">
          <Info size={18} className="mr-2 text-emerald-500" />
          Ждут одобрения ({pendingTasks.length})
        </h3>
        
        {pendingTasks.length === 0 ? (
          <div className="py-20 rounded-[40px] border-4 border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 italic font-bold uppercase tracking-widest text-xs">
            Все миссии проверены ✅
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingTasks.map(task => (
              <div 
                key={task.id}
                className="p-6 rounded-[32px] border-2 bg-white/5 flex items-center justify-between animate-in slide-in-from-right-10"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center space-x-5">
                  <div className="text-4xl p-4 bg-white/5 rounded-2xl">{task.icon}</div>
                  <div>
                    <h4 className="font-black uppercase text-sm tracking-tight">{task.title}</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase">+{task.reward} {currencyIcon}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onRejectTask(task.id)}
                    className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                    <X size={24} />
                  </button>
                  <button 
                    onClick={() => onApproveTask(task.id)}
                    className="p-4 rounded-2xl bg-emerald-500 text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
          <h4 className="text-[10px] font-black uppercase opacity-40 mb-2">Общая касса</h4>
          <p className="text-2xl font-black italic">{balance} <span className="text-xs opacity-50">{currencyIcon}</span></p>
        </div>
        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
          <h4 className="text-[10px] font-black uppercase opacity-40 mb-2">Активная цель</h4>
          <p className="text-sm font-black italic truncate">{dream.title || 'Не выбрана'}</p>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
