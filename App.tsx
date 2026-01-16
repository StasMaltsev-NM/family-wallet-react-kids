
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TabId, 
  ThemeId, 
  UserState, 
  Reward,
  TaskStatus,
  Transaction,
  PurchasedItem
} from './types';
import { 
  THEMES, 
  INITIAL_TASKS, 
  INITIAL_REWARDS 
} from './constants';
import BottomNav from './components/BottomNav';
import WalletScreen from './components/WalletScreen';
import MissionsScreen from './components/MissionsScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import ImageEditor from './components/ImageEditor';
import ParentDashboard from './components/ParentDashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('wallet');
  const [themeId, setThemeId] = useState<ThemeId>(ThemeId.GOLDEN_TROPHY);
  
  // Изначально наполняем историю примерами, как просил пользователь
  const initialHistory: Transaction[] = [
    { id: 'h1', type: 'plus', title: 'Убраться в комнате', amount: 50, icon: '🧹', timestamp: Date.now() - 3600000 },
    { id: 'h2', type: 'plus', title: 'Помыть посуду', amount: 30, icon: '🍽️', timestamp: Date.now() - 7200000 },
    { id: 'h3', type: 'plus', title: 'Домашка по математике', amount: 100, icon: '📚', timestamp: Date.now() - 10800000 },
    { id: 'h4', type: 'minus', title: 'Мороженое', amount: 50, icon: '🍦', timestamp: Date.now() - 14400000 },
    { id: 'h5', type: 'minus', title: 'Час игр на ПК', amount: 100, icon: '⏰', timestamp: Date.now() - 18000000 },
    { id: 'h6', type: 'minus', title: 'Билет в кино', amount: 200, icon: '🍿', timestamp: Date.now() - 21600000 },
  ];

  const [user, setUser] = useState<UserState>({
    balance: 150,
    pendingBalance: 50,
    lifetimeEarnings: 500,
    name: 'Геймер_99',
    currencyName: 'Очки Вэй',
    currencyIcon: '⭐',
    tasks: INITIAL_TASKS.map(t => t.id === '1' ? { ...t, status: TaskStatus.WAITING } : t),
    purchasedRewards: [],
    inventory: [],
    badges: ['b1'],
    dream: {
      title: 'PlayStation 5',
      goal: 10000,
      icon: '🎮',
      status: 'ACTIVE'
    },
    history: initialHistory,
    isParentMode: false,
    notifications: {
      wallet: 0,
      missions: 0, 
      shop: 0
    }
  });

  const theme = THEMES[themeId];

  useEffect(() => {
    const waitingCount = user.tasks.filter(t => t.status === TaskStatus.WAITING).length;
    const pendingSum = user.tasks
      .filter(t => t.status === TaskStatus.WAITING)
      .reduce((sum, t) => sum + t.reward, 0);

    setUser(prev => ({
      ...prev,
      pendingBalance: pendingSum,
      notifications: { 
        ...prev.notifications, 
        missions: waitingCount,
        wallet: prev.inventory.length
      }
    }));
  }, [user.tasks, user.inventory]);

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

  const addTransaction = (type: 'plus' | 'minus', title: string, amount: number, icon: string) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      amount,
      icon,
      timestamp: Date.now()
    };
  };

  const handlePurchaseReward = (reward: Reward) => {
    if (user.balance < reward.price) return;
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', theme.accent] });
    const tx = addTransaction('minus', `Куплено: ${reward.title}`, reward.price, reward.icon);
    
    const purchasedItem: PurchasedItem = {
      ...reward,
      purchaseId: Math.random().toString(36).substr(2, 9)
    };

    setUser(prev => ({
      ...prev,
      balance: prev.balance - reward.price,
      purchasedRewards: reward.recurring ? prev.purchasedRewards : [...prev.purchasedRewards, reward.id],
      inventory: [...prev.inventory, purchasedItem],
      history: [tx, ...prev.history]
    }));
  };

  const handleReceiveReward = (purchaseId: string) => {
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    setUser(prev => ({
      ...prev,
      inventory: prev.inventory.filter(item => item.purchaseId !== purchaseId)
    }));
  };

  const handleCompleteMission = (taskId: string) => {
    setUser(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: TaskStatus.WAITING } : t)
    }));
  };

  const handleApproveMission = (taskId: string) => {
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', theme.accent] });
    const tx = addTransaction('plus', task.title, task.reward, task.icon);
    setUser(prev => ({
      ...prev,
      balance: prev.balance + task.reward,
      lifetimeEarnings: prev.lifetimeEarnings + task.reward,
      history: [tx, ...prev.history],
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: TaskStatus.CONFIRMED } : t)
    }));
  };

  const handleSaveDream = (title: string, goal: number) => {
    setUser(prev => ({
      ...prev,
      dream: {
        title,
        goal,
        icon: '🚀',
        status: 'ACTIVE'
      }
    }));
  };

  const handleDeleteDream = () => {
    setUser(prev => ({
      ...prev,
      dream: { title: '', goal: 0, icon: '', status: 'NONE' }
    }));
  };

  const handleClaimDream = () => {
    confetti({ particleCount: 300, spread: 150, origin: { y: 0.4 } });
    setUser(prev => ({
      ...prev,
      dream: { ...prev.dream, status: 'CLAIMED' }
    }));
  };

  const renderScreen = () => {
    if (user.isParentMode && activeTab === 'parent') {
      return (
        <ParentDashboard 
          tasks={user.tasks} dream={user.dream} theme={theme}
          onApproveTask={handleApproveMission} onRejectTask={(id) => {}}
          onApproveDream={(p) => {}} balance={user.balance}
          currencyName={user.currencyName} currencyIcon={user.currencyIcon}
          onUpdateCurrency={(n, i) => {}}
        />
      );
    }

    switch (activeTab) {
      case 'wallet': 
        return (
          <WalletScreen 
            balance={user.balance} 
            pendingBalance={user.pendingBalance} 
            theme={theme} 
            dream={user.dream} 
            history={user.history} 
            tasks={user.tasks}
            inventory={user.inventory}
            currencyName={user.currencyName} 
            currencyIcon={user.currencyIcon} 
            onSaveDream={handleSaveDream} 
            onDeleteDream={handleDeleteDream} 
            onClaimDream={handleClaimDream} 
            onReceiveReward={handleReceiveReward}
          />
        );
      case 'missions': return <MissionsScreen tasks={user.tasks} onComplete={handleCompleteMission} theme={theme} currencyIcon={user.currencyIcon} balance={user.balance} pendingBalance={user.pendingBalance} />;
      case 'shop': return <ShopScreen balance={user.balance} pendingBalance={user.pendingBalance} rewards={INITIAL_REWARDS.filter(r => !user.purchasedRewards.includes(r.id))} onPurchase={handlePurchaseReward} theme={theme} currencyIcon={user.currencyIcon} />;
      case 'profile': return <ProfileScreen name={user.name} lifetimeEarnings={user.lifetimeEarnings} completedCount={user.tasks.filter(t => t.status === TaskStatus.CONFIRMED).length} theme={theme} currentThemeId={themeId} onThemeChange={setThemeId} isParentMode={user.isParentMode} currencyIcon={user.currencyIcon} />;
      case 'editor': return <ImageEditor theme={theme} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <main className="flex-grow overflow-y-auto">
        {renderScreen()}
      </main>
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        isParentMode={user.isParentMode}
        notifications={user.notifications}
      />
    </div>
  );
};

export default App;
