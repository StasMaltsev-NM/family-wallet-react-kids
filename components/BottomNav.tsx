
import React from 'react';
import { Wallet, ListTodo, Gift, User, Wand2, ShieldCheck } from 'lucide-react';
import { TabId, AppTheme, UserNotifications } from '../types';

interface BottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  theme: AppTheme;
  isParentMode: boolean;
  notifications: UserNotifications;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, theme, isParentMode, notifications }) => {
  const navItems = isParentMode ? [
    { id: 'parent' as TabId, icon: ShieldCheck, label: 'Контроль', count: 0 },
    { id: 'profile' as TabId, icon: User, label: 'Профиль', count: 0 },
  ] : [
    { id: 'wallet' as TabId, icon: Wallet, label: 'Очки', count: notifications.wallet },
    { id: 'missions' as TabId, icon: ListTodo, label: 'Миссии', count: notifications.missions },
    { id: 'shop' as TabId, icon: Gift, label: 'Магазин', count: notifications.shop },
    { id: 'editor' as TabId, icon: Wand2, label: 'Магия', count: 0 },
    { id: 'profile' as TabId, icon: User, label: 'Я', count: 0 },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-24 px-4 pb-6 flex items-center justify-around z-50"
      style={{ backgroundColor: `${theme.bg}EE`, backdropFilter: 'blur(15px)' }}
    >
      <div className="flex w-full max-w-md mx-auto justify-between items-center bg-white/5 rounded-[32px] p-2 border border-white/10 shadow-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] h-14 rounded-2xl transition-all duration-500 relative ${
                isActive ? 'scale-110 -translate-y-2' : 'opacity-40 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isActive ? theme.surface : 'transparent',
                boxShadow: isActive ? `0 10px 25px ${theme.shadow}` : 'none',
                border: isActive ? `1.5px solid ${theme.accent}` : 'none',
              }}
            >
              <div className="relative">
                <Icon 
                  size={isActive ? 26 : 22} 
                  color={isActive ? theme.accent : theme.text} 
                />
                {item.count > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border border-white/20 animate-pulse"
                  >
                    {item.count}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="text-[8px] font-black mt-1 uppercase tracking-widest" style={{ color: theme.accent }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
