import React, { useMemo, useState } from "react";
import { useKidInviteCode } from "../hooks/useKidInviteCode";

type Props = {
  children: (
    kidCode: string,
    actions: { clearKidCode: () => void }
  ) => React.ReactNode;
};

const KidAuthGate: React.FC<Props> = ({ children }) => {
  const { code, save, clear } = useKidInviteCode();
  const [input, setInput] = useState("");

  const isValid = useMemo(() => input.trim().length >= 6, [input]);

  if (!code) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center px-4 py-6 sm:py-10">
        <div
          className="w-full max-w-[560px] rounded-[26px] sm:rounded-[30px] border-4 px-4 py-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
          style={{
            borderColor: "#FFD700",
            background:
              "radial-gradient(circle at 20% 10%, rgba(255,215,0,0.14), transparent 48%), #111319",
          }}
        >
          <div className="text-[24px] sm:text-[28px] font-black italic uppercase tracking-tight text-white leading-none mb-2">
            Вход ребёнка
          </div>
          <div className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.11em] text-white/70 mb-4">
            Введи код, который дал родитель
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Например: KID_STAS"
            className="w-full rounded-2xl px-4 py-3.5 sm:py-4 text-[22px] sm:text-[30px] font-black italic uppercase tracking-tight bg-black/70 text-white border-2 placeholder:text-white/35 focus:outline-none"
            style={{ borderColor: "#FFD700", boxShadow: "inset 0 0 0 1px rgba(255,215,0,0.16)" }}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />

          <button
            className={`mt-4 w-full rounded-2xl py-4 font-black uppercase tracking-[0.16em] transition-all ${
              isValid
                ? "active:scale-[0.98] shadow-[0_10px_28px_rgba(255,215,0,0.45)]"
                : "opacity-45 grayscale"
            }`}
            disabled={!isValid}
            onClick={() => save(input)}
            style={{
              color: "#141414",
              background: "linear-gradient(180deg, #FFE76A 0%, #FFD700 50%, #F6BF00 100%)",
            }}
          >
            Войти
          </button>

          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.08em] text-white/45 mt-4">
            Можно также открыть ссылку с кодом: <br />
            <span className="text-white/65">...?code=KID_XXXX</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(code, { clearKidCode: clear })}</>;
};

export default KidAuthGate;
