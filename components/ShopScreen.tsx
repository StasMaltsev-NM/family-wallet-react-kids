
import React from 'react';
import { Star, Infinity, CheckCircle2 } from 'lucide-react';
import { Reward, AppTheme } from '../types';

interface ShopScreenProps {
  balance: number;
  pendingBalance: number;
  rewards: Reward[];
  onPurchase: (reward: Reward) => void;
  theme: AppTheme;
  currencyIcon: string;
  recentlyPurchasedRewardIds?: Record<string, boolean>;
  isLoading?: boolean;
}

const withAlpha = (color: string, alpha: number): string => {
  const normalized = String(color ?? "").trim();
  const safeAlpha = Math.max(0, Math.min(1, alpha));

  if (/^#([0-9a-f]{6})$/i.test(normalized)) {
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  if (/^#([0-9a-f]{3})$/i.test(normalized)) {
    const r = parseInt(normalized[1] + normalized[1], 16);
    const g = parseInt(normalized[2] + normalized[2], 16);
    const b = parseInt(normalized[3] + normalized[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  return normalized || `rgba(255,255,255,${safeAlpha})`;
};

const ShopScreen: React.FC<ShopScreenProps> = ({
  balance,
  pendingBalance,
  rewards,
  onPurchase,
  theme,
  currencyIcon,
  recentlyPurchasedRewardIds = {},
  isLoading = false,
}) => {
  const showSkeletons = rewards.length === 0;
  const skeletonBorderSoft = withAlpha(theme.accent, 0.28);
  const skeletonBorderStrong = withAlpha(theme.accent, 0.9);
  const skeletonGlow = withAlpha(theme.accent, 0.42);

  return (
    <div className="flex flex-col pt-8 pb-36 px-6 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase leading-none" style={{ color: theme.text }}>
            МАГАЗИН <br />
            <span style={{ color: theme.accent }}>ПРИЗОВ</span>
          </h1>
        </div>
        <div 
          className="flex flex-col items-end px-5 py-3 rounded-[24px] border-2 bg-black/40 backdrop-blur-xl"
          style={{ borderColor: theme.accent, boxShadow: `0 10px 30px ${theme.shadow}` }}
        >
          <div className="flex items-center">
            <span className="mr-2 text-xl">{currencyIcon}</span>
            <span className="font-black text-2xl italic">{balance}</span>
          </div>
          <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em]">Доступно</span>
        </div>
      </div>

      {showSkeletons ? (
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`shop-skeleton-${idx}`}
              className="shop-skeleton-slot flex flex-col rounded-[32px] overflow-hidden border-4 animate-pulse"
              style={{
                backgroundColor: theme.surface,
                borderColor: skeletonBorderSoft,
                color: theme.accent,
                boxShadow: `0 0 0 0 ${skeletonGlow}`,
                ['--shop-skeleton-border-soft' as string]: skeletonBorderSoft,
                ['--shop-skeleton-border-strong' as string]: skeletonBorderStrong,
                ['--shop-skeleton-glow' as string]: skeletonGlow,
              } as React.CSSProperties}
            >
              <div className="h-40 bg-white/10" />
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <div className="h-4 rounded-xl bg-white/10" />
                <div className="h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <span className="shop-skeleton-star text-lg">★</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-5">
        {rewards.map((reward) => {
          const canAfford = balance >= reward.price;
          const isUnique = !reward.recurring;
          const isRecentlyPurchased = Boolean(recentlyPurchasedRewardIds[reward.id]);
          
          return (
            <div 
              key={reward.id}
              className="flex flex-col rounded-[32px] overflow-hidden border-4 transition-all duration-500 relative group hover:scale-[1.03] active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: theme.surface,
                borderColor: isRecentlyPurchased ? '#F97316' : canAfford ? theme.accent : '#F97316',
                boxShadow: isRecentlyPurchased
                  ? '0 12px 28px rgba(249, 115, 22, 0.35)'
                  : canAfford
                  ? `0 10px 25px ${theme.shadow}`
                  : '0 10px 25px rgba(249, 115, 22, 0.2)'
              }}
            >
              {/* Image Section - Always Colorful now */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={reward.image} 
                  alt={reward.title} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                />
                
                {/* Ribbon for Unique Items */}
                {isUnique && (
                  <div className="absolute top-0 right-0 bg-[#FFD700] text-black px-3 py-1 rounded-bl-xl font-black text-[8px] uppercase tracking-tighter flex items-center shadow-lg">
                    <Star size={10} className="mr-1 fill-black" strokeWidth={3} /> РЕДКОЕ
                  </div>
                )}

                {!isUnique && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                    <Infinity size={14} className="text-white/70" />
                  </div>
                )}

                <div className="absolute bottom-2 left-2 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-center text-2xl shadow-xl">
                  {reward.icon}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <h3 className="font-black text-[10px] leading-tight uppercase tracking-tight text-center">{reward.title}</h3>
                
                <button
                  disabled={!canAfford || isRecentlyPurchased}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(reward);
                  }}
                  className={`w-full py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center relative overflow-hidden ${
                    isRecentlyPurchased
                      ? 'opacity-95 cursor-not-allowed border-2 border-orange-400/70'
                      : canAfford 
                      ? 'animate-magnetic-pulse glossy-btn shadow-xl active:scale-90' 
                      : 'opacity-60 cursor-not-allowed border-2 border-orange-500/50'
                  }`}
                  style={{ 
                    backgroundColor: isRecentlyPurchased
                      ? 'rgba(249, 115, 22, 0.22)'
                      : canAfford
                      ? theme.accent
                      : 'rgba(0,0,0,0.3)',
                    color: isRecentlyPurchased
                      ? '#FB923C'
                      : canAfford
                      ? theme.bg
                      : '#F97316',
                  }}
                >
                  {isRecentlyPurchased ? (
                    <div className="flex items-center justify-center w-full space-x-2">
                      <CheckCircle2 size={22} />
                      <span className="text-sm tracking-wider">КУПЛЕНО</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full space-x-1">
                      <span className="text-3xl italic tracking-tighter">{reward.price}</span>
                      <Star 
                        size={28} 
                        strokeWidth={3} 
                        fill="none" 
                        className="opacity-90"
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <style>{`
        @keyframes magnetic-pulse {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.3); box-shadow: 0 0 30px currentColor; }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes shop-skeleton-star-cycle {
          0% { color: #FACC15; text-shadow: 0 0 8px rgba(250,204,21,0.55); }
          33% { color: #F472B6; text-shadow: 0 0 8px rgba(244,114,182,0.55); }
          66% { color: #60A5FA; text-shadow: 0 0 8px rgba(96,165,250,0.55); }
          100% { color: #FACC15; text-shadow: 0 0 8px rgba(250,204,21,0.55); }
        }
        @keyframes shop-skeleton-border-cycle {
          0%, 100% {
            border-color: var(--shop-skeleton-border-soft);
            box-shadow: 0 0 0 0 var(--shop-skeleton-glow);
          }
          50% {
            border-color: var(--shop-skeleton-border-strong);
            box-shadow: 0 0 16px 0 var(--shop-skeleton-glow);
          }
        }
        .animate-magnetic-pulse {
          animation: magnetic-pulse 1.5s infinite ease-in-out;
        }
        .shop-skeleton-slot {
          animation: shop-skeleton-border-cycle 1.55s ease-in-out infinite;
        }
        .shop-skeleton-star {
          animation: shop-skeleton-star-cycle 1.4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShopScreen;
