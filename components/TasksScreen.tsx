
import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';
// Added TaskStatus to the imported types from types.ts
import { Task, AppTheme, TaskStatus } from '../types';

interface TasksScreenProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  theme: AppTheme;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ tasks, onComplete, theme }) => {
  return (
    <div className="flex flex-col pt-8 pb-32 px-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase" style={{ color: theme.text }}>
          Missions <span style={{ color: theme.accent }}>To Complete</span>
        </h1>
        <p className="opacity-50 font-medium">Earn FAM by helping out!</p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id}
            // Check task.status against TaskStatus.CONFIRMED instead of missing completed property
            className={`group relative overflow-hidden p-5 rounded-[24px] border-2 transition-all duration-300 ${
              task.status === TaskStatus.CONFIRMED ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'
            }`}
            style={{ 
              backgroundColor: theme.surface,
              // Check task.status against TaskStatus.CONFIRMED instead of missing completed property
              borderColor: task.status === TaskStatus.CONFIRMED ? 'rgba(255,255,255,0.1)' : theme.accent,
              boxShadow: task.status === TaskStatus.CONFIRMED ? 'none' : `0 8px 20px ${theme.shadow}`
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex space-x-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ backgroundColor: `${theme.accent}22` }}
                >
                  {task.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black">{task.title}</h3>
                  <p className="text-sm opacity-60 font-medium leading-tight">{task.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center font-black text-2xl" style={{ color: theme.accent }}>
                  +{task.reward}
                  <Star size={18} fill={theme.accent} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Check task.status against TaskStatus.CONFIRMED instead of missing completed property */}
            {task.status !== TaskStatus.CONFIRMED ? (
              <button
                onClick={() => onComplete(task.id)}
                className="w-full glossy-btn py-3 rounded-2xl font-black text-lg uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2"
                style={{ 
                  backgroundColor: theme.accent, 
                  color: theme.bg,
                  boxShadow: `0 6px 15px ${theme.shadow}`
                }}
              >
                <span>I Finished It!</span>
                <CheckCircle2 size={24} />
              </button>
            ) : (
              <div className="w-full py-3 text-center font-bold opacity-50">
                Completed!
              </div>
            )}
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-2 opacity-5">
               <Star size={80} fill="white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksScreen;
