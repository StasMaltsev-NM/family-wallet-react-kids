import React, { useEffect, useMemo, useState } from "react";

const STAR_PATH =
  "M50 7 L61.8 34.7 L91.5 37.4 L69 57.1 L76 86.5 L50 70.6 L24 86.5 L31 57.1 L8.5 37.4 L38.2 34.7 Z";
const LOADER_COLORS = ["#FACC15", "#F472B6", "#60A5FA"];

const BootLoadingScreen: React.FC = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const activeColor = useMemo(() => LOADER_COLORS[colorIndex % LOADER_COLORS.length], [colorIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setColorIndex((prev) => (prev + 1) % LOADER_COLORS.length);
    }, 650);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-white">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full blur-2xl transition-colors duration-500" style={{ backgroundColor: `${activeColor}33` }} />
        <svg viewBox="0 0 100 100" className="relative w-full h-full">
          <path
            d={STAR_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={STAR_PATH}
            fill="none"
            stroke={activeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="boot-star-loader"
            style={{ filter: `drop-shadow(0 0 8px ${activeColor})` }}
          />
        </svg>
      </div>

      <p
        className="mt-8 text-[13px] font-black uppercase tracking-[0.28em] transition-colors duration-500"
        style={{ color: activeColor }}
      >
        ЗАГРУЗКА
      </p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 text-center">
        Подтягиваем данные приложения
      </p>

      <style>{`
        @keyframes boot-star-trace {
          0% {
            stroke-dasharray: 24 260;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 140 260;
            stroke-dashoffset: -130;
          }
          100% {
            stroke-dasharray: 24 260;
            stroke-dashoffset: -260;
          }
        }

        .boot-star-loader {
          stroke-dasharray: 24 260;
          animation: boot-star-trace 1.35s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BootLoadingScreen;
