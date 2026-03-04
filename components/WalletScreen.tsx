import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Gift,
  CheckCircle,
} from "lucide-react";
import {
  AppTheme,
  Dream,
  Transaction,
  Task,
  TaskStatus,
  PurchasedItem,
} from "../types";
import DreamCard from "./DreamCard";
import { getBalanceSizeTier } from "./balanceSizing";

interface WalletScreenProps {
  inviteCode: string;
  balance: number;
  pendingBalance: number;
  theme: AppTheme;
  dream: Dream;
  history: Transaction[];
  tasks: Task[];
  inventory: PurchasedItem[];
  currencyName: string;
  currencyIcon: string;
  onSaveDream: (title: string, goal: number) => void;
  onDeleteDream: () => void;
  onClaimDream?: () => void;
  onReceiveReward: (purchaseId: string) => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  inviteCode,
  balance,
  pendingBalance,
  theme,
  dream,
  history,
  tasks,
  inventory,
  currencyIcon,
  onSaveDream,
  onDeleteDream,
  onClaimDream,
  onReceiveReward,
}) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // важно: displayBalance должен обновляться когда balance пришел новый с API
  useEffect(() => {
    setDisplayBalance(balance);
  }, [balance]);

  // Рендерим только то, что пришло сверху
  const safeHistory = useMemo(() => {
    return Array.isArray(history) ? history : [];
  }, [history]);

  // анимируем баланс плавно
  useEffect(() => {
    if (balance !== displayBalance) {
      const step = Math.ceil(Math.abs(balance - displayBalance) / 10) || 1;
      const timer = setTimeout(() => {
        if (displayBalance < balance) {
          setDisplayBalance((prev) => Math.min(prev + step, balance));
        } else {
          setDisplayBalance((prev) => Math.max(prev - step, balance));
        }
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const pendingTasks = tasks.filter((t) => t.status === TaskStatus.WAITING);
  const balanceSizeTier = getBalanceSizeTier(displayBalance);
  const balanceFontSizePx =
    balanceSizeTier === "tight" ? 48 : balanceSizeTier === "compact" ? 54 : 60;

  return (
    <div className="flex flex-col px-4 sm:px-5 md:px-6 lg:px-8 pt-1.5 sm:pt-2 space-y-2.5 sm:space-y-3">
      <div className="mb-0">
        <div
          className="inline-flex items-center gap-2.5 sm:gap-3 rounded-2xl border px-3.5 sm:px-4 py-2 sm:py-2.5"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <h1
            className="text-[36px] sm:text-[42px] md:text-[44px] font-black italic tracking-tight uppercase leading-none"
            style={{ color: theme.accent }}
          >
            ВЭЙ!
          </h1>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl sm:text-2xl shadow-lg">
            😎
          </div>
        </div>
      </div>

      {/* DREAM CARD */}
      <DreamCard
        inviteCode={inviteCode}
        dream={dream}
        balance={balance}
        theme={theme}
        onSaveDream={onSaveDream}
        onDeleteDream={onDeleteDream}
        onClaimDream={onClaimDream}
      />

      {/* BALANCE SECTION */}
      <div
        className="relative p-5 sm:p-6 md:p-8 rounded-[28px] sm:rounded-[34px] md:rounded-[40px] border-[3px] sm:border-4 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden"
        style={{
          borderColor: theme.accent,
          backgroundColor: theme.surface,
          boxShadow: `0 20px 60px ${theme.shadow}`,
        }}
      >
        <div className="absolute top-3 left-4 sm:top-4 sm:left-8 flex items-center space-x-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em]">
            Готов потратить
          </span>
        </div>

        <div className="mt-4 sm:mt-5 flex w-full items-center justify-start gap-2.5 sm:gap-3 pl-0.5 sm:pl-1">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-[20px] sm:rounded-3xl flex items-center justify-center text-[28px] sm:text-3xl shadow-xl border-2 border-white/10"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})`,
            }}
          >
            <span className="inline-flex leading-none translate-x-[2.5px] -translate-y-[0.5px]">{currencyIcon}</span>
          </div>
          <span
            className="block min-w-0 whitespace-nowrap font-black italic leading-none"
            style={{
              color: theme.text,
              fontSize: `clamp(34px, 10vw, ${balanceFontSizePx}px)`,
              letterSpacing: "-0.04em",
            }}
          >
            {displayBalance}
          </span>
        </div>
      </div>

      {/* INVENTORY SECTION - ОЖИДАЕТ ВРУЧЕНИЯ */}
      <div
        className={`space-y-2 transition-all duration-300 ${
          isInventoryOpen ? "bg-indigo-500/5 p-2 rounded-[28px] sm:rounded-[38px]" : ""
        }`}
      >
        <button
          onClick={() => setIsInventoryOpen(!isInventoryOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border-[3px] sm:border-4 bg-indigo-500/5 transition-all active:scale-[0.98]"
          style={{
            borderColor: "rgba(99, 102, 241, 0.4)",
            borderStyle: "solid",
          }}
        >
          <div className="flex items-center space-x-3 sm:space-x-4 text-left">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 relative">
              <Gift size={18} className={inventory.length > 0 ? "animate-bounce" : ""} />
              {inventory.length > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-black">
                  {inventory.length}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400/60 leading-none mb-1">
                Твои награды
              </h4>
              <p className="text-[17px] sm:text-lg font-black italic text-indigo-400 uppercase tracking-tight">
                ОЖИДАЕТ ВРУЧЕНИЯ
              </p>
            </div>
          </div>
          {isInventoryOpen ? (
            <ChevronUp className="text-indigo-400" />
          ) : (
            <ChevronDown className="text-indigo-400" />
          )}
        </button>

        {isInventoryOpen && (
          <div className="space-y-2 px-1 animate-in slide-in-from-top-2 duration-300">
            {inventory.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] border-2 border-dashed border-white/5 text-center opacity-30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                Нет купленных наград
              </div>
            ) : (
              <div className="bg-black/20 rounded-[24px] sm:rounded-[32px] p-2 space-y-2 border border-white/5">
                {inventory.map((item) => (
                  <div
                    key={item.purchaseId}
                    className="p-3.5 sm:p-4 rounded-[20px] sm:rounded-[28px] bg-white/5 border-2 border-dashed border-indigo-500/30 flex flex-col space-y-4"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xl">
                            {item.icon || "🎁"}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm sm:text-base font-black uppercase tracking-tight leading-none mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-1 opacity-60">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase">
                            Куплено за {item.price} {currencyIcon}
                          </span>
                        </div>
                      </div>
                      <div className="text-[26px] sm:text-3xl">{item.icon}</div>
                    </div>

                    <button
                      onClick={() => onReceiveReward(item.purchaseId)}
                      className="w-full py-3 rounded-xl bg-indigo-500 text-white font-black uppercase text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
                    >
                      <CheckCircle size={14} />
                      <span>ПОЛУЧЕНО</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PENDING SECTION - ОЖИДАЕТ РОДИТЕЛЕЙ */}
      <div
        className={`space-y-2 transition-all duration-300 ${
          isPendingOpen ? "bg-orange-500/5 p-2 rounded-[28px] sm:rounded-[38px]" : ""
        }`}
      >
        <button
          onClick={() => setIsPendingOpen(!isPendingOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border-[3px] sm:border-4 bg-orange-500/5 transition-all active:scale-[0.98]"
          style={{
            borderColor: "rgba(249, 115, 22, 0.4)",
            borderStyle: "solid",
          }}
        >
          <div className="flex items-center space-x-3 sm:space-x-4 text-left">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 relative">
              <Clock size={18} className="animate-spin-slow" />
              {pendingTasks.length > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-500 text-black text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-black">
                  {pendingTasks.length}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-orange-400/60 leading-none mb-1">
                В пути на кошелёк
              </h4>
              <p className="text-[17px] sm:text-lg font-black italic text-orange-400 uppercase tracking-tight">
                ОЖИДАЕТ РОДИТЕЛЕЙ
              </p>
            </div>
          </div>
          {isPendingOpen ? (
            <ChevronUp className="text-orange-400" />
          ) : (
            <ChevronDown className="text-orange-400" />
          )}
        </button>

        {isPendingOpen && (
          <div className="space-y-2 px-1 animate-in slide-in-from-top-2 duration-300">
            {pendingTasks.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] border-2 border-dashed border-white/5 text-center opacity-30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                Нет миссий на проверке
              </div>
            ) : (
              <div className="bg-black/20 rounded-[24px] sm:rounded-[32px] p-2 space-y-2 border border-white/5">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 rounded-[20px] sm:rounded-[28px] bg-white/5 border-2 border-dashed border-orange-500/30 flex items-center justify-between transition-all gap-2"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-[26px] sm:text-3xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {task.icon}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black uppercase tracking-tight leading-none mb-1">
                          {task.title}
                        </h4>
                        <p className="text-[8px] sm:text-[9px] font-black text-orange-400 uppercase opacity-60">
                          в пути на кошелёк
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <ArrowUp size={16} className="text-orange-400 animate-pulse shrink-0" />
                      <span className="font-black italic text-xl sm:text-2xl text-orange-400 whitespace-nowrap">
                        +{task.reward} {currencyIcon}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HISTORY SECTION - ИСТОРИЯ */}
      <div
        className={`space-y-2 transition-all duration-300 ${
          isHistoryOpen ? "bg-white/5 p-2 rounded-[28px] sm:rounded-[38px]" : ""
        }`}
      >
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/5 border-[3px] sm:border-4 transition-all active:scale-[0.98]"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            borderStyle: "solid",
          }}
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 text-white/40">
              <History size={18} />
            </div>
            <h3 className="text-[17px] sm:text-lg font-black uppercase italic tracking-tighter">
              ИСТОРИЯ
            </h3>
          </div>
          {isHistoryOpen ? (
            <ChevronUp className="opacity-40" />
          ) : (
            <ChevronDown className="opacity-40" />
          )}
        </button>

        {isHistoryOpen && (
          <div className="space-y-0 px-1.5 sm:px-2 pb-2 animate-in slide-in-from-top-2 duration-300 bg-black/20 rounded-[20px] sm:rounded-[28px] overflow-hidden">
            {safeHistory.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center opacity-20 text-center">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em] sm:tracking-[0.4em]">
                  Пусто
                </p>
              </div>
            ) : (
              safeHistory.slice(0, 6).map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`py-4 sm:py-6 flex items-center justify-between transition-colors px-3 sm:px-4 gap-2 ${
                    idx !== safeHistory.slice(0, 6).length - 1
                      ? "border-b border-white/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
                    <span className="text-xl sm:text-2xl opacity-80 shrink-0">{tx.icon}</span>
                    <div className="flex flex-col">
                      <h4 className="text-sm sm:text-lg font-black uppercase tracking-tight leading-none truncate max-w-[170px] sm:max-w-none">
                        {tx.title}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] font-black opacity-30 uppercase mt-1 tracking-widest">
                        {formatDate(tx.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="font-black italic text-lg sm:text-2xl whitespace-nowrap"
                    style={{
                      color: tx.type === "plus" ? "#10B981" : "#EF4444",
                    }}
                  >
                    {tx.type === "plus" ? "+" : "-"}
                    {tx.amount} {currencyIcon}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>


      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div> 
  );
};
export default WalletScreen;
