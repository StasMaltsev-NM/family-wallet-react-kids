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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass p-4 rounded-2xl">
          <div className="text-xl font-semibold mb-2">Вход ребёнка</div>
          <div className="text-sm opacity-80 mb-4">
            Введи код, который дал родитель
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Например: KID_XXXX"
            className="w-full rounded-xl p-3 text-black"
            autoCapitalize="characters"
            autoCorrect="off"
          />

          <button
            className="mt-3 w-full rounded-xl p-3 glossy-btn"
            disabled={!isValid}
            onClick={() => save(input)}
            style={{ opacity: isValid ? 1 : 0.5 }}
          >
            Войти
          </button>

          <div className="text-xs opacity-60 mt-3">
            Можно также открыть ссылку с кодом: <br />
            <span className="opacity-80">...?code=KID_XXXX</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(code, { clearKidCode: clear })}</>;
};

export default KidAuthGate;