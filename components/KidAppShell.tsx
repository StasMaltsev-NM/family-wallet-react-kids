import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { primeDreamCache } from "./DreamCard";
import ImageEditor from "./ImageEditor";
import ParentDashboard from "./ParentDashboard";
import BootLoadingScreen from "./BootLoadingScreen";

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

const isThemeId = (value: unknown): value is ThemeId =>
  Object.values(ThemeId).includes(value as ThemeId);

const extractRewardsArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const directCandidates = [
    raw?.rewards,
    raw?.items,
    raw?.data,
    raw?.data?.rewards,
    raw?.data?.items,
    raw?.result,
    raw?.result?.rewards,
    raw?.result?.items,
  ];
  const direct = directCandidates.find(Array.isArray);
  if (Array.isArray(direct)) return direct;

  for (const value of Object.values(raw)) {
    if (Array.isArray(value)) return value as any[];
    if (value && typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (Array.isArray(nested)) return nested as any[];
      }
    }
  }

  return [];
};


type Props = {
  kidCode: string;
};

const KidAppShell: React.FC<Props> = ({ kidCode }) => {
  const [activeTab, setActiveTab] = useState<TabId>("wallet");
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return ThemeId.GOLDEN_TROPHY;
    const savedThemeId = window.localStorage.getItem(`fw_theme_id:${kidCode || "unknown"}`);
    return isThemeId(savedThemeId) ? savedThemeId : ThemeId.GOLDEN_TROPHY;
  });
const [pollMs, setPollMs] = useState(6000);
const [isOnline, setIsOnline] = useState(true);
const [history, setHistory] = useState<Transaction[]>([]);
  const [recentlyPurchasedRewardIds, setRecentlyPurchasedRewardIds] = useState<Record<string, boolean>>({});
  const [purchasingRewardIds, setPurchasingRewardIds] = useState<Record<string, boolean>>({});
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const rewardsRequestInFlight = useRef(false);
  const rewardsLastFetchAt = useRef(0);
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
  const recentRewardsSessionKey = useMemo(
    () => `fw_shop_recent_rewards:${kidCode || "unknown"}`,
    [kidCode]
  );
  const themeStorageKey = useMemo(
    () => `fw_theme_id:${kidCode || "unknown"}`,
    [kidCode]
  );
  const rewardsCacheKey = useMemo(
    () => `fw_shop_rewards_cache:${kidCode || "unknown"}`,
    [kidCode]
  );

  const markRewardAsRecentlyPurchased = (rewardId: string) => {
    if (!rewardId) return;
    setRecentlyPurchasedRewardIds((prev) => ({ ...prev, [rewardId]: true }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(recentRewardsSessionKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setRecentlyPurchasedRewardIds(parsed as Record<string, boolean>);
      }
    } catch (e) {
      console.warn("[KID] failed to restore recent purchases cache:", e);
    }
  }, [recentRewardsSessionKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(recentlyPurchasedRewardIds);
      if (keys.length === 0) {
        window.sessionStorage.removeItem(recentRewardsSessionKey);
        return;
      }
      window.sessionStorage.setItem(
        recentRewardsSessionKey,
        JSON.stringify(recentlyPurchasedRewardIds)
      );
    } catch (e) {
      console.warn("[KID] failed to save recent purchases cache:", e);
    }
  }, [recentlyPurchasedRewardIds, recentRewardsSessionKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(rewardsCacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setApiRewards(parsed as any[]);
      }
    } catch (e) {
      console.warn("[KID] failed to restore rewards cache:", e);
    }
  }, [rewardsCacheKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedThemeId = window.localStorage.getItem(themeStorageKey);
      setThemeId(isThemeId(savedThemeId) ? savedThemeId : ThemeId.GOLDEN_TROPHY);
    } catch (e) {
      console.warn("[KID] failed to restore theme:", e);
      setThemeId(ThemeId.GOLDEN_TROPHY);
    }
  }, [themeStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(themeStorageKey, themeId);
    } catch (e) {
      console.warn("[KID] failed to persist theme:", e);
    }
  }, [themeId, themeStorageKey]);

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
  setIsRewardsLoading(true);
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
const loadRewards = async (showLoader = false, force = false) => {
  if (!kidCode) return;
  if (rewardsRequestInFlight.current) return;

  const now = Date.now();
  if (!force && now - rewardsLastFetchAt.current < 2500) return;
  rewardsLastFetchAt.current = now;
  rewardsRequestInFlight.current = true;

  if (showLoader) setIsRewardsLoading(true);
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const res = await kidApi.listRewards(kidCode);
    const raw = res as any;
    const allRewards = extractRewardsArray(raw);

    const elapsedMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt);
    console.log("[KID] loaded rewards:", allRewards.length, "in", `${elapsedMs}ms`, "keys:", Object.keys(raw ?? {}));
    // Доверяем backend-фильтрации по invite code, чтобы не терять валидные карточки на фронте.
    setApiRewards(allRewards);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(rewardsCacheKey, JSON.stringify(allRewards));
      } catch (cacheErr) {
        console.warn("[KID] failed to persist rewards cache:", cacheErr);
      }
    }
  } catch (e) {
    console.error("[KID] loadRewards FAIL:", e);
  } finally {
    rewardsRequestInFlight.current = false;
    if (showLoader) setIsRewardsLoading(false);
  }
};

const preloadDream = async () => {
  try {
    if (!kidCode) return;
    const res = await kidApi.getMyDream(kidCode);
    primeDreamCache(kidCode, res?.dream ?? null);
  } catch (e) {
    console.warn("[KID] preloadDream skipped:", e);
    // Даже при сетевом сбое праймим null, чтобы не показывать промежуточный лоадер карточки.
    if (kidCode) primeDreamCache(kidCode, null);
  }
};

  // initial load
  useEffect(() => {
    let isCancelled = false;
    setIsBootLoading(true);

    const failSafeTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setIsRewardsLoading(false);
        setIsBootLoading(false);
      }
    }, 15000);

    void (async () => {
      await Promise.allSettled([loadTasks(), loadRewards(true, true), preloadDream()]);
      if (!isCancelled) {
        setIsRewardsLoading(false);
        setIsBootLoading(false);
      }
      window.clearTimeout(failSafeTimer);
    })();

    return () => {
      isCancelled = true;
      window.clearTimeout(failSafeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidCode]);
  // polling
useEffect(() => {
  if (!kidCode) return;

  const id = window.setInterval(() => {
    loadTasks();
    void loadRewards(false, false);
  }, pollMs);

  return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [kidCode, pollMs]);

useEffect(() => {
  if (activeTab !== "shop" || !kidCode) return;
  void loadRewards(false, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, kidCode]);

useEffect(() => {
  if (!kidCode || typeof document === "undefined") return;
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void loadRewards(false, true);
    }
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [kidCode]);

  // ребенок нажал "выполнить"
  const handleCompleteMission = async (taskId: string) => {
    const localTask = user.tasks.find((t) => t.id === taskId);
    if (!localTask) return;
    if (localTask.status !== TaskStatus.IDLE) return;

    const reward = Number(localTask.reward || 0);

    // Оптимистично сразу показываем "ждём одобрения..."
    setUser((prev) => {
      const nextTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, status: TaskStatus.WAITING } : t
      );
      const waitingCount = nextTasks.filter((t) => t.status === TaskStatus.WAITING).length;
      return {
        ...prev,
        tasks: nextTasks,
        pendingBalance: prev.pendingBalance + reward,
        notifications: {
          ...prev.notifications,
          missions: waitingCount,
          wallet: prev.inventory.length,
        },
      };
    });
    setApiTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "WAITING" } : t))
    );

    try {
      console.log("[KID] completeTask click:", { kidCode, taskId });

      await kidApi.completeTask(kidCode, taskId);

      console.log("[KID] completeTask OK, refetch tasks");
      await loadTasks();
    } catch (e) {
      console.error("[KID] completeTask FAIL:", e);

      // Откат optimistic-обновления при ошибке сети/API
      setUser((prev) => {
        const nextTasks = prev.tasks.map((t) =>
          t.id === taskId && t.status === TaskStatus.WAITING
            ? { ...t, status: TaskStatus.IDLE }
            : t
        );
        const waitingCount = nextTasks.filter((t) => t.status === TaskStatus.WAITING).length;
        return {
          ...prev,
          tasks: nextTasks,
          pendingBalance: Math.max(0, prev.pendingBalance - reward),
          notifications: {
            ...prev.notifications,
            missions: waitingCount,
            wallet: prev.inventory.length,
          },
        };
      });
      setApiTasks((prev) =>
        prev.map((t) => (t.id === taskId && t.status === "WAITING" ? { ...t, status: "IDLE" } : t))
      );
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
      const rewardImageById = new Map<string, string>();
      const rewardImageByTitle = new Map<string, string>();
      for (const reward of apiRewards) {
        const image = String(reward?.image_url ?? reward?.image ?? "").trim();
        if (!image) continue;

        const rewardId = String(reward?.id ?? "").trim();
        const rewardTitle = String(reward?.title ?? "").trim().toLowerCase();
        if (rewardId) rewardImageById.set(rewardId, image);
        if (rewardTitle) rewardImageByTitle.set(rewardTitle, image);
      }

      // 🎁 ВОССТАНАВЛИВАЕМ "НА ВРУЧЕНИЕ" ИЗ БЭКА:
      // inventory = все покупки со статусом pending
      const pendingPurchases = historyItems.filter(
        (x: any) => x?.type === "purchase" && x?.status === "pending"
      );

      if (!cancelled) {
        setUser((prev: any) => {
          const prevImageByPurchaseId = new Map<string, string>();
          for (const item of prev?.inventory ?? []) {
            const purchaseId = String(item?.purchaseId ?? "");
            const image = String(item?.image ?? "").trim();
            if (purchaseId && image) prevImageByPurchaseId.set(purchaseId, image);
          }

          const pendingInventory = pendingPurchases.map((p: any, idx: number) => {
            const purchaseId = String(p?.id ?? p?.purchase_id ?? "").trim();
            const stablePurchaseId = purchaseId || `purchase_${idx}_${String(p?.created_at ?? "")}`;
            const rewardId = String(p?.reward_id ?? "");
            const title = String(p?.title ?? p?.reward_title ?? "Награда");
            const titleKey = title.trim().toLowerCase();

            const imageFromHistory = [
              p?.image_url,
              p?.reward_image_url,
              p?.reward_image,
              p?.image,
            ]
              .map((value) => String(value ?? "").trim())
              .find(Boolean);

            const image =
              imageFromHistory ||
              rewardImageById.get(rewardId) ||
              rewardImageByTitle.get(titleKey) ||
              prevImageByPurchaseId.get(stablePurchaseId) ||
              `https://picsum.photos/seed/reward_${stablePurchaseId || rewardId || titleKey}/600/600`;

            return {
              id: stablePurchaseId, // чтобы React key был стабильный
              purchaseId: stablePurchaseId, // важно для confirmReceived
              title,
              icon: String(p?.icon ?? p?.reward_icon ?? "🎁"),
              price: Math.abs(Number(p?.amount ?? p?.price ?? 0)), // amount на бэке отрицательный
              image,
            };
          });

          return {
            ...prev,
            inventory: pendingInventory, // <- теперь "на вручение" после refresh не пропадёт
            notifications: {
              ...prev.notifications,
              wallet: pendingInventory.length,
            },
          };
        });
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
}, [apiRewards, kidCode, localHistory]);

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
  if (recentlyPurchasedRewardIds[reward.id]) return;
  if (purchasingRewardIds[reward.id]) return;

  const isPermanent = Boolean(
    (reward as any)?.recurring ??
    (reward as any)?.is_permanent ??
    (reward as any)?.isPermanent ??
    false
  );

  const shouldOptimisticallyHide = !isPermanent;

  try {
    if (!kidCode) {
      console.error('[KID] kidCode is empty!');
      alert('Код доступа не найден. Перезайдите в приложение.');
      return;
    }

    // Мгновенный визуальный отклик при нажатии.
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#FFD700", theme.accent],
    });

    // Мгновенный UX-отклик: сразу отмечаем как купленное и списываем баланс.
    setPurchasingRewardIds((prev) => ({ ...prev, [reward.id]: true }));
    markRewardAsRecentlyPurchased(reward.id);
    setUser((prev: any) => ({
      ...prev,
      balance: Math.max(0, Number(prev.balance ?? 0) - Number(reward.price ?? 0)),
      purchasedRewards: shouldOptimisticallyHide
        ? Array.from(new Set([...(prev.purchasedRewards ?? []), reward.id]))
        : (prev.purchasedRewards ?? []),
    }));

    console.log('[KID] purchaseReward START:', { 
      kidCode, 
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardPrice: reward.price
    });

// 1) ВЫЗЫВАЕМ API
const res = await kidApi.purchaseReward(kidCode, reward.id);

console.log("[KID] purchaseReward SUCCESS:", res);

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
    await loadRewards(false, true);
  } catch (e) {
    console.error("[KID] purchaseReward FAIL:", e);
    setRecentlyPurchasedRewardIds((prev) => {
      if (!prev[reward.id]) return prev;
      const next = { ...prev };
      delete next[reward.id];
      return next;
    });
    setUser((prev: any) => ({
      ...prev,
      balance: Number(prev.balance ?? 0) + Number(reward.price ?? 0),
      purchasedRewards: shouldOptimisticallyHide
        ? (prev.purchasedRewards ?? []).filter((id: string) => id !== reward.id)
        : (prev.purchasedRewards ?? []),
    }));
    alert("Ошибка при покупке награды: " + (e as any).message);
  } finally {
    setPurchasingRewardIds((prev) => {
      if (!prev[reward.id]) return prev;
      const next = { ...prev };
      delete next[reward.id];
      return next;
    });
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
            inviteCode={kidCode}
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
            tasks={user.tasks.filter((t) => t.status !== TaskStatus.CONFIRMED)}
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
              .map((r) => {
                const id = String(r?.id ?? r?.reward_id ?? r?.rewardId ?? "");
                return {
                  id,
                  title: String(r?.title ?? r?.name ?? "Награда"),
                  price: Number(r?.price ?? r?.cost ?? r?.amount ?? 0),
                  image: String(r?.image_url ?? r?.image ?? "").trim() || `https://picsum.photos/seed/${id || "reward"}/600/600`,
                  icon: String(r?.icon ?? "🎁"),
                  recurring: Boolean(r?.is_permanent === 1 || r?.is_permanent === true || r?.recurring),
                };
              })
              .filter((r) => !user.purchasedRewards.includes(r.id))
            }
            onPurchase={handlePurchaseReward}
            theme={theme}
            currencyIcon={user.currencyIcon}
            recentlyPurchasedRewardIds={recentlyPurchasedRewardIds}
            isLoading={isRewardsLoading}
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
          />
        );

      default:
        return null;
    }
  };

  if (isBootLoading) {
    return <BootLoadingScreen />;
  }

  const isEditorTab = activeTab === "editor";

  return (
    <div
      className="h-[100dvh] min-h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <main className="scrollArea flex-1 overflow-y-auto pb-[108px] sm:pb-[118px] md:pb-[128px]">
        <div className="mx-auto w-full max-w-[1120px]">
          {!isEditorTab && renderScreen()}
          <div className={isEditorTab ? "block" : "hidden"}>
            <ImageEditor theme={theme} kidCode={kidCode} />
          </div>
        </div>
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

export default KidAppShell;
