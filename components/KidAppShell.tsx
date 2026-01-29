import React, { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";

import { kidApi } from "../services/api";

import {
  TabId,
  ThemeId,
  UserState,
  Reward,
  TaskStatus,
  Transaction,
  PurchasedItem,
} from "../types";

import { THEMES, INITIAL_TASKS, INITIAL_REWARDS } from "../constants";

import BottomNav from "./BottomNav";
import WalletScreen from "./WalletScreen";
import MissionsScreen from "./MissionsScreen";
import ShopScreen from "./ShopScreen";
import ProfileScreen from "./ProfileScreen";
import ImageEditor from "./ImageEditor";
import ParentDashboard from "./ParentDashboard";

type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  icon?: string | null;
  status: "IDLE" | "WAITING" | "CONFIRMED";
  created_at?: string;
  updated_at?: string;
};

const mapApiStatusToUi = (s: ApiTask["status"]): TaskStatus => {
  switch (s) {
    case "WAITING":
      return TaskStatus.WAITING;
    case "CONFIRMED":
      return TaskStatus.CONFIRMED;
    case "IDLE":
    default:
      return TaskStatus.IDLE;
  }
};

const mapApiTaskToUiTask = (t: ApiTask) => ({
  id: t.id,
  title: t.title,
  icon: t.icon ?? "✅",
  reward: Number(t.reward_amount ?? 0),
  status: mapApiStatusToUi(t.status),
});

type Props = {
  kidCode: string;
};

const KidAppShell: React.FC<Props> = ({ kidCode }) => {
  const [activeTab, setActiveTab] = useState<TabId>("wallet");
  const [themeId, setThemeId] = useState<ThemeId>(ThemeId.GOLDEN_TROPHY);
const [pollMs, setPollMs] = useState(3000);
const [isOnline, setIsOnline] = useState(true);
const [history, setHistory] = useState<Transaction[]>([]);
  // 1) Источник задач от backend
  const [apiTasks, setApiTasks] = useState<ApiTask[]>([]);
  const [apiRewards, setApiRewards] = useState<any[]>([]);


  // 2) Локальная история для "минусов" (покупки) - backend пока не отдает
   const [localHistory, setLocalHistory] = useState<Transaction[]>([]);
  const [user, setUser] = useState<UserState>({
    childId: '',
    balance: 150,
    pendingBalance: 50,
    lifetimeEarnings: 500,
    name: "Геймер_99",
    currencyName: "Очки Вэй",
    currencyIcon: "⭐",
    tasks: INITIAL_TASKS.map((t) =>
      t.id === "1" ? { ...t, status: TaskStatus.WAITING } : t
    ),
    purchasedRewards: [],
    inventory: [],
    badges: ["b1"],
    dream: {
      title: "PlayStation 5",
      goal: 10000,
      icon: "🎮",
      status: "ACTIVE",
    },
    history: [],
    isParentMode: false,
    notifications: {
      wallet: 0,
      missions: 0,
      shop: 0,
    },
  });

  const theme = THEMES[themeId];

  // Тема
  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

// --- API: профиль ребенка (баланс) ---
const loadMe = async () => {
  try {
    if (!kidCode) return;
    const me: any = await kidApi.whoami(kidCode);

    console.log("[KID] whoami:", {
      balance: me?.balance,
      pending_balance: me?.pending_balance,
      name: me?.name,
      lifetime_earnings: me?.lifetime_earnings,  // ← ДОБАВИЛИ!
    });

setUser((prev) => ({
  ...prev,
  childId: String(me?.child_id ?? prev.childId),
  balance: Number(me?.balance ?? prev.balance),
  pendingBalance: Number(me?.pending_balance ?? prev.pendingBalance),
  name: String(me?.name ?? prev.name),
  lifetimeEarnings: Number(me?.lifetime_earnings ?? prev.lifetimeEarnings), // ← ДОБАВЬ!
}));
  } catch (e) {
    console.error("[KID] loadMe FAIL:", e);
  }
};

// --- API: загрузка задач ребенка (single source of truth) ---
const loadTasks = async () => {
  try {
    if (!kidCode) return;

    const res = await kidApi.getTasks(kidCode);
    const nextApiTasks = (res?.tasks ?? []) as ApiTask[];
    setApiTasks(nextApiTasks);

    const uiTasks = nextApiTasks.map(mapApiTaskToUiTask);
const loadTasks = async () => {
  try {
    if (!kidCode) return;

    const res = await kidApi.getTasks(kidCode);
    const nextApiTasks = (res?.tasks ?? []) as ApiTask[];
    setApiTasks(nextApiTasks);

    const uiTasks = nextApiTasks.map(mapApiTaskToUiTask);

    const waitingCount = uiTasks.filter((t) => t.status === TaskStatus.WAITING).length;
    const pendingSum = uiTasks
      .filter((t) => t.status === TaskStatus.WAITING)
      .reduce((sum, t) => sum + t.reward, 0);

    setUser((prev) => ({
      ...prev,
      tasks: uiTasks,
      pendingBalance: pendingSum,
      notifications: {
        ...prev.notifications,
        missions: waitingCount,
        wallet: prev.inventory.length,
      },
    }));

    await loadMe();
  } catch (e) {
    console.error("[KID] loadTasks FAIL:", e);
  }
  // --- API: загрузка наград ребенка ---
const loadRewards = async () => {
  try {
    if (!kidCode) return;

    const res = await kidApi.listRewards(kidCode);
    const nextApiRewards = (res?.rewards ?? []) as any[];
    
    console.log("[KID] loaded rewards:", nextApiRewards.length);
    
    setApiRewards(nextApiRewards);
  } catch (e) {
    console.error("[KID] loadRewards FAIL:", e);
  }
};

};
    // pending = сумма только WAITING задач
    const pendingSum = uiTasks
      .filter((t) => t.status === TaskStatus.WAITING)
      .reduce((sum, t) => sum + (Number(t.reward) || 0), 0);

    const waitingCount = uiTasks.filter(
      (t) => t.status === TaskStatus.WAITING
    ).length;

    setUser((prev) => ({
      ...prev,
      tasks: uiTasks,
      pendingBalance: pendingSum,
      notifications: {
        ...prev.notifications,
        missions: waitingCount,
        wallet: prev.inventory.length,
      },
    }));

    await loadMe();
  } catch (e) {
    console.error("[KID] loadTasks FAIL:", e);
  }
};
// --- API: загрузка наград ребенка ---
const loadRewards = async () => {
  try {
    if (!kidCode) return;

    const res = await kidApi.listRewards(kidCode);
    const allRewards = (res?.rewards ?? []) as any[];
    
    // Фильтруем награды только для текущего ребёнка
    // Получаем child_id из whoami
      const me = await kidApi.whoami(kidCode);
      const myChildId = me?.child_id;  // ← ПРАВИЛЬНО!
    
// Показываем награды:
// 1) Созданные для этого ребёнка (r.child_id === myChildId)
// 2) ИЛИ общие награды без child_id (r.child_id === null или пустое)
    const myRewards = allRewards.filter((r: any) => 
      !r.child_id || r.child_id === myChildId
    );
    
    console.log("[KID] loaded rewards:", myRewards.length, "из", allRewards.length);
    
    setApiRewards(myRewards);
  } catch (e) {
    console.error("[KID] loadRewards FAIL:", e);
  }
};

  // initial load
  useEffect(() => {
    loadTasks();
    loadRewards();  // ← ДОБАВИЛИ!
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidCode]);
  // polling
useEffect(() => {
  if (!kidCode) return;

  const id = window.setInterval(() => {
    loadTasks();
    loadRewards();
  }, pollMs);

  return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [kidCode, pollMs]);

  // ребенок нажал "выполнить"
  const handleCompleteMission = async (taskId: string) => {
    try {
      console.log("[KID] completeTask click:", { kidCode, taskId });

      await kidApi.completeTask(kidCode, taskId);

      console.log("[KID] completeTask OK, refetch tasks");
      await loadTasks();
    } catch (e) {
      console.error("[KID] completeTask FAIL:", e);
    }
  };


// === История: всегда из API /api/history (tasks confirmed = плюс) + purchases = минус + localHistory ===
useEffect(() => {
  let cancelled = false;

  const loadHistory = async () => {
    try {
      const resp = await kidApi.getHistory(kidCode);
      const historyItems = Array.isArray(resp?.history) ? resp.history : [];

      // ✅ ПЛЮСЫ — только подтверждённые миссии
      const apiPlus: Transaction[] = historyItems
        .filter((x: any) => x?.type === "task" && x?.status === "CONFIRMED")
        .map((t: any) => {
          const ts = t.created_at
            ? new Date(String(t.created_at).replace(" ", "T")).getTime()
            : Date.now();

          return {
            id: String(t.id),
            type: "plus",
            title: String(t.title ?? "Миссия"),
            amount: Number(t.amount ?? 0),
            icon: String(t.icon ?? "✅"),
            timestamp: ts,
          };
        });

      // ✅ МИНУСЫ — покупки (pending + received)
      const apiMinus: Transaction[] = historyItems
        .filter((x: any) => x?.type === "purchase")
        .map((p: any) => {
          const ts = p.created_at
            ? new Date(String(p.created_at).replace(" ", "T")).getTime()
            : Date.now();

          return {
            id: String(p.id),
            type: "minus",
            title: `Награда: ${String(p.title ?? "")}`.trim(),
            amount: Math.abs(Number(p.amount ?? 0)),
            icon: String(p.icon ?? "🎁"),
            timestamp: ts,
          };
        });
      // 🎁 ВОССТАНАВЛИВАЕМ "НА ВРУЧЕНИЕ" ИЗ БЭКА:
      // inventory = все покупки со статусом pending
      const pendingInventory = historyItems
        .filter((x: any) => x?.type === "purchase" && x?.status === "pending")
        .map((p: any) => ({
          id: String(p.id),                 // чтобы React key был стабильный
          purchaseId: String(p.id),          // важно для confirmReceived
          title: String(p.title ?? "Награда"),
          icon: String(p.icon ?? "🎁"),
          price: Math.abs(Number(p.amount ?? 0)), // amount на бэке отрицательный
        }));

      if (!cancelled) {
        setUser((prev: any) => ({
          ...prev,
          inventory: pendingInventory, // <- теперь "на вручение" после refresh не пропадёт
        }));
      }
      const merged = [...localHistory, ...apiPlus, ...apiMinus]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 7);

      if (!cancelled) {
        setHistory(merged);
      }
    } catch (e) {
      console.log("[KID] history load failed:", e);
      if (!cancelled) {
        setHistory(
          [...localHistory]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 7)
        );
      }
    }
  };

  if (kidCode) {
    loadHistory();
  }

  return () => {
    cancelled = true;
  };
}, [kidCode, localHistory]);

  // helper для создания транзакции
  const addTransaction = (
    type: "plus" | "minus",
    title: string,
    amount: number,
    icon: string
  ) => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    title,
    amount,
    icon,
    timestamp: Date.now(),
  });

  // покупка награды -> минус в локальную историю + инвентарь
// Покупка награды через API
const handlePurchaseReward = async (reward: Reward) => {
  if (user.balance < reward.price) return;

  try {
    if (!kidCode) {
      console.error('[KID] kidCode is empty!');
      alert('Код доступа не найден. Перезайдите в приложение.');
      return;
    }

    console.log('[KID] purchaseReward START:', { 
      kidCode, 
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardPrice: reward.price
    });

// 1) ВЫЗЫВАЕМ API
const res = await kidApi.purchaseReward(kidCode, reward.id);

console.log("[KID] purchaseReward SUCCESS:", res);

// 2) ЭФФЕКТ
confetti({
  particleCount: 200,
  spread: 100,
  origin: { y: 0.6 },
  colors: ["#FFD700", theme.accent],
});

// 3) ЛОКАЛЬНАЯ ИСТОРИЯ (минус)
const tx = addTransaction(
  "minus",
  `Куплено: ${reward.title}`,
  Number(reward.price ?? 0),
  reward.icon ?? "🎁"
);
setLocalHistory((prev) => [tx, ...prev]);

// 4) Достаём purchaseId максимально безопасно (без "purchase" по типам)
const purchaseId = String(
  (res as any)?.purchase?.id ??
  (res as any)?.purchaseId ??
  (res as any)?.purchase_id ??
  ""
);

// 5) Готовим предмет инвентаря (не ломаемся на типах)
const purchasedItem = {
  ...reward,
  purchaseId,
} as any; // <-- убираем боль от несовпадения PurchasedItem

// 6) Перманентность: ВАЖНО - в UI мы прокидываем recurring
// (см. ShopScreen mapping: recurring: r.is_permanent === 1)
const isPermanent = Boolean(
  (reward as any)?.recurring ??               // <-- КЛЮЧЕВО
  (reward as any)?.is_permanent ??
  (reward as any)?.isPermanent ??
  false
);
// 7) Обновляем user
setUser((prev: any) => ({
  ...prev,
  balance: Number((res as any)?.new_balance ?? prev.balance ?? 0),

  // одноразовые: скрываем из магазина, добавляя в purchasedRewards
  // постоянные: не добавляем
  purchasedRewards: isPermanent
    ? (prev.purchasedRewards ?? [])
    : [...(prev.purchasedRewards ?? []), reward.id],

  inventory: [...(prev.inventory ?? []), purchasedItem],
}));
    // ПЕРЕЗАГРУЖАЕМ НАГРАДЫ!
    await loadRewards();
  } catch (e) {
    console.error("[KID] purchaseReward FAIL:", e);
    alert("Ошибка при покупке награды: " + (e as any).message);
  }
};

const handleReceiveReward = async (purchaseId: string) => {
  try {
    if (!purchaseId) {
      console.error("[KID] EMPTY purchaseId, skip confirm");
      alert("Ошибка: не найден ID покупки");
      return;
    }

    console.log("[KID] confirmReceived START:", {
      kidCode,
      purchaseId,
    });

    const res = await kidApi.confirmReceived(kidCode, purchaseId);

    console.log("[KID] confirmReceived SUCCESS:", res);

    confetti({
      particleCount: 120,
      spread: 60,
      origin: { y: 0.8 },
    });

    // УБИРАЕМ ИЗ ИНВЕНТАРЯ СРАЗУ
    setUser((prev) => ({
      ...prev,
      inventory: prev.inventory.filter(
        (item) => item.purchaseId !== purchaseId
      ),
    }));

    // ИСТОРИЯ ОБНОВИТСЯ СЛЕДУЮЩИМ POLL / useEffect
  } catch (e: any) {
    console.error("[KID] confirmReceived FAIL:", e);
    alert("Ошибка при подтверждении получения награды");
  }
};
  // parent mode (можно оставить, но history не трогаем тут)
  const handleApproveMission = (taskId: string) => {
    // В kid-app это обычно не используется, но пусть будет для режима родителя
    const task = user.tasks.find((t) => t.id === taskId);
    if (!task) return;

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10B981", theme.accent],
    });

    setUser((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, status: TaskStatus.CONFIRMED } : t
      ),
    }));

    // важно: НЕ пишем prev.history руками - history собирается useEffect-ом выше
    // и обновится на следующем loadTasks/poll
  };

  const handleSaveDream = (title: string, goal: number) => {
    setUser((prev) => ({
      ...prev,
      dream: { title, goal, icon: "🚀", status: "ACTIVE" },
    }));
  };

  const handleDeleteDream = () => {
    setUser((prev) => ({
      ...prev,
      dream: { title: "", goal: 0, icon: "", status: "NONE" },
    }));
  };

  const handleClaimDream = () => {
    confetti({ particleCount: 300, spread: 150, origin: { y: 0.4 } });
    setUser((prev) => ({
      ...prev,
      dream: { ...prev.dream, status: "CLAIMED" },
    }));
  };

  const renderScreen = () => {
    if (user.isParentMode && activeTab === "parent") {
      return (
        <ParentDashboard
          tasks={user.tasks}
          dream={user.dream}
          theme={theme}
          onApproveTask={handleApproveMission}
          onRejectTask={() => {}}
          onApproveDream={() => {}}
          balance={user.balance}
          currencyName={user.currencyName}
          currencyIcon={user.currencyIcon}
          onUpdateCurrency={() => {}}
        />
      );
    }

    switch (activeTab) {
      case "wallet":
        return (
          <WalletScreen
            balance={user.balance}
            pendingBalance={user.pendingBalance}
            theme={theme}
            dream={user.dream}
            history={history}
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

      case "missions":
        return (
          <MissionsScreen
            tasks={user.tasks}
            onComplete={handleCompleteMission}
            theme={theme}
            currencyIcon={user.currencyIcon}
            balance={user.balance}
            pendingBalance={user.pendingBalance}
          />
        );

      case "shop":
        return (
          <ShopScreen
            balance={user.balance}
            pendingBalance={user.pendingBalance}
            rewards={apiRewards
              .filter((r) => !user.purchasedRewards.includes(r.id))
              .map((r) => ({
                id: r.id,
                title: r.title,
                price: r.price,
                icon: r.icon || '🎁',
                recurring: r.is_permanent === 1,
              }))
            }
            onPurchase={handlePurchaseReward}
            theme={theme}
            currencyIcon={user.currencyIcon}
          />
        );

      case "profile":
        return (
          <ProfileScreen
            name={user.name}
            lifetimeEarnings={user.lifetimeEarnings}
            completedCount={
              user.tasks.filter((t) => t.status === TaskStatus.CONFIRMED).length
            }
            theme={theme}
            currentThemeId={themeId}
            onThemeChange={setThemeId}
            isParentMode={user.isParentMode}
            currencyIcon={user.currencyIcon}
          />
        );

      case "editor":
        return <ImageEditor theme={theme} />;

      default:
        return null;
    }
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <main className="flex-1 overflow-y-auto pb-20">{renderScreen()}</main>

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

export default KidAppShell;