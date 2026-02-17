import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Rocket, Star, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { KidDreamApi, kidApi } from "../services/api";
import { AppTheme, Dream } from "../types";

interface DreamCardProps {
  inviteCode: string;
  dream: Dream;
  balance: number;
  theme: AppTheme;
  onSaveDream: (title: string, goal: number) => void;
  onDeleteDream: () => void;
  onClaimDream?: () => void;
}

type DreamUiStatus = "none" | "pending" | "active";
type DreamFormMode = "create" | "recreate";

const ACTIVE_EXISTING_ERROR = "У ребёнка уже есть активная мечта";
const dreamCache = new Map<string, KidDreamApi | null>();

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDreamStatus = (dream: KidDreamApi | null): DreamUiStatus => {
  if (!dream) return "none";
  const rawStatus = String(dream.status ?? "").toLowerCase();
  if (rawStatus.includes("active")) return "active";
  if (rawStatus.includes("pending")) return "pending";
  return "none";
};

const normalizeError = (err: unknown): string => {
  const raw = err instanceof Error ? err.message : "";
  if (!raw) return "Не удалось обработать запрос к серверу";
  if (raw.includes(ACTIVE_EXISTING_ERROR)) return ACTIVE_EXISTING_ERROR;
  if (raw.startsWith("HTTP 4")) return "Ошибка запроса. Проверь данные и попробуй снова.";
  if (raw.startsWith("HTTP 5")) return "Сервер временно недоступен. Попробуй чуть позже.";
  return raw;
};

const DreamCard: React.FC<DreamCardProps> = ({
  inviteCode,
  dream,
  balance,
  theme,
  onSaveDream: _onSaveDream,
  onDeleteDream: _onDeleteDream,
  onClaimDream,
}) => {
  const hasCachedDream = Boolean(inviteCode) && dreamCache.has(inviteCode);
  const [inputTitle, setInputTitle] = useState("");
  const [serverDream, setServerDream] = useState<KidDreamApi | null>(() =>
    hasCachedDream ? dreamCache.get(inviteCode) ?? null : null
  );
  const [isLoading, setIsLoading] = useState(!hasCachedDream);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formMode, setFormMode] = useState<DreamFormMode>("create");

  const loadDream = useCallback(
    async (silent = false) => {
      if (!inviteCode) {
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const res = await kidApi.getMyDream(inviteCode);
        const nextDream = res?.dream ?? null;
        dreamCache.set(inviteCode, nextDream);
        setServerDream(nextDream);
        if (nextDream) setFormMode("create");
        setErrorMessage("");
      } catch (err) {
        setErrorMessage(normalizeError(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [inviteCode]
  );

  useEffect(() => {
    const hasCache = Boolean(inviteCode) && dreamCache.has(inviteCode);
    if (hasCache) {
      setServerDream(dreamCache.get(inviteCode) ?? null);
      setIsLoading(false);
      void loadDream(true);
      return;
    }
    setServerDream(null);
    setIsLoading(true);
    void loadDream(false);
  }, [inviteCode, loadDream]);

  const uiStatus = useMemo(() => normalizeDreamStatus(serverDream), [serverDream]);

  useEffect(() => {
    if (uiStatus !== "pending") return;
    const timer = window.setInterval(() => {
      void loadDream(true);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [uiStatus, loadDream]);

  const dreamId = String(serverDream?.id ?? "");
  const dreamTitle = String(serverDream?.title ?? dream.title ?? "");
  const targetAmount = Math.max(0, toNumber(serverDream?.target_amount, dream.goal));
  const currentAmount = Math.max(0, toNumber(serverDream?.current_amount, balance));
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const progressRounded = Math.round(progress);
  const isReached = uiStatus === "active" && targetAmount > 0 && remainingAmount <= 0;
  const dreamImageUrl =
    typeof serverDream?.image_url === "string" ? String(serverDream.image_url).trim() : "";
  const heroBackgroundStyle = dreamImageUrl
    ? {
        backgroundImage: `linear-gradient(160deg, rgba(10,12,16,0.48), rgba(12,13,17,0.74)), radial-gradient(circle at 30% 30%, rgba(255,198,88,0.32), transparent 46%), url(${dreamImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "radial-gradient(circle at 28% 28%, rgba(255,196,78,0.4), transparent 45%), radial-gradient(circle at 72% 78%, rgba(255,180,62,0.18), transparent 42%), linear-gradient(160deg, #12141b 0%, #1c2029 54%, #11131a 100%)",
      };

  useEffect(() => {
    if (isReached) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#FFD700", "#FFFFFF", theme.accent],
      });
    }
  }, [isReached, theme.accent]);

  const handleCreate = async () => {
    const title = inputTitle.trim();
    if (!title) {
      setErrorMessage("Введите название мечты");
      return;
    }
    if (!inviteCode) {
      setErrorMessage("Код доступа не найден. Перезапусти приложение.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await kidApi.createDream(inviteCode, title);
      const createdDream = res?.dream ?? {
        title,
        status: "pending",
        target_amount: 0,
        current_amount: 0,
      };
      dreamCache.set(inviteCode, createdDream);
      setServerDream(createdDream);
      setInputTitle("");
      setFormMode("create");
      void loadDream(true);
    } catch (err) {
      setErrorMessage(normalizeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!inviteCode) {
      setErrorMessage("Код доступа не найден. Перезапусти приложение.");
      return;
    }
    if (!dreamId) {
      setErrorMessage("Не удалось удалить мечту: отсутствует ID.");
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");
    try {
      await kidApi.deleteDream(inviteCode, dreamId);
      dreamCache.set(inviteCode, null);
      setServerDream(null);
      setFormMode("recreate");
    } catch (err) {
      setErrorMessage(normalizeError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteButton = () => (
    <button
      onClick={() => void handleDelete()}
      disabled={isDeleting || !dreamId}
      className="absolute top-4 right-4 z-20 rounded-xl border border-slate-400/55 bg-slate-900/85 p-2.5 text-slate-100 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-all hover:border-slate-200 hover:text-white disabled:opacity-45"
      title="Удалить мечту"
    >
      <Trash2 size={18} />
    </button>
  );

  const renderHeroPanel = (statusHint?: string) => (
    <div
      className="relative overflow-hidden rounded-[30px] border border-white/10 px-4 pt-4 pb-5"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 30px rgba(0,0,0,0.28)" }}
    >
      <div className="absolute inset-0" style={heroBackgroundStyle} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/70" />
      {renderDeleteButton()}

      <div className="relative z-10 pr-14">
        <h3 className="text-[38px] leading-[0.95] font-black uppercase italic tracking-tight text-white truncate">
          {dreamTitle}
        </h3>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/55">
          ТВОЯ ГЛАВНАЯ МЕЧТА
        </p>
        <div className="mt-8 flex items-end justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">ПРОГРЕСС</span>
          <span className="text-[42px] leading-none font-black italic text-[#F0CF28]">
            {statusHint ? "..." : `${progressRounded}%`}
          </span>
        </div>
        <p className="mt-1 text-xl leading-none font-black uppercase tracking-[0.1em] text-white">
          ПРОГРЕСС И МЕЧТА
        </p>
        {statusHint && (
          <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-yellow-200">{statusHint}</p>
        )}
      </div>

      <div className="relative z-10 mt-4 h-4 w-full rounded-full bg-black/65 p-1 border border-white/10 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-1000 relative"
          style={{
            width: `${progress}%`,
            background: isReached
              ? "linear-gradient(90deg, #FFA500, #FFD700)"
              : `linear-gradient(90deg, ${theme.secondary}, ${theme.accent})`,
          }}
        >
          <div className="absolute inset-0 bg-white/15 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div
        className="w-full p-8 rounded-[40px] border-2 bg-black/40 backdrop-blur-xl"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <p className="text-sm font-black uppercase opacity-60 tracking-wider">Загрузка мечты...</p>
      </div>
    );
  }

  if (uiStatus === "none") {
    const actionLabel = formMode === "recreate" ? "OK" : "Создать";
    return (
      <div
        className="w-full p-8 rounded-[40px] border-2 bg-black/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500"
        style={{ borderColor: "rgba(255,255,255,0.05)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
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
              onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
              className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 text-base font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white placeholder:opacity-20"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm font-bold text-rose-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            onClick={() => void handleCreate()}
            disabled={!inputTitle.trim() || isSubmitting}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all ${
              inputTitle.trim() && !isSubmitting ? "active:scale-95 shadow-lg" : "opacity-20 grayscale"
            }`}
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <Rocket size={20} />
            <span>{isSubmitting ? "Создание..." : actionLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  if (uiStatus === "pending") {
    return (
      <div
        className="w-full p-5 rounded-[40px] border-4 animate-in fade-in zoom-in-95 duration-300"
        style={{
          borderColor: "rgba(250,204,21,0.55)",
          backgroundColor: "rgba(0,0,0,0.35)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        }}
      >
        {renderHeroPanel("В ОЖИДАНИИ РОДИТЕЛЯ")}
        <p className="mt-2 text-xs font-black uppercase tracking-[0.15em] text-white/50">
          Проверяем одобрение каждые 8 секунд
        </p>
        {errorMessage && <p className="mt-3 text-sm font-bold text-rose-300">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div
      className="w-full p-5 rounded-[40px] border-4 relative overflow-hidden group transition-all duration-700 animate-in slide-in-from-top-4"
      style={{
        borderColor: isReached ? "#FFD700" : theme.accent,
        backgroundColor: theme.surface,
        boxShadow: isReached ? "0 15px 50px rgba(255, 215, 0, 0.3)" : `0 15px 40px ${theme.shadow}`,
      }}
    >
      {renderHeroPanel()}

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-xs font-bold text-rose-200">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center bg-black/30 p-4 rounded-3xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-2xl font-black italic uppercase leading-none">
            <span style={{ color: "#FFEA66" }}>Осталось: {remainingAmount}</span>
            <span style={{ color: "#D9A700" }}> ★</span>
          </span>
          <span className="mt-2 text-xs font-black uppercase tracking-wider text-white/70">
            Сумма мечты: <span style={{ color: "#F4CB2F" }}>{targetAmount}</span>
            <span style={{ color: "#B88300" }}> ★</span>
          </span>
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
