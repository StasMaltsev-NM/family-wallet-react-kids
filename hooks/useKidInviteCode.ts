import { useCallback, useEffect, useMemo, useState } from "react";

const LS_KEY = "fwk_kid_invite_code";
const URL_PARAM = "code";

function normalize(raw: string | null | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

function readCodeFromUrl(): string {
  // 1) query: ?code=KID_XXXX
  const url = new URL(window.location.href);
  const q = normalize(url.searchParams.get(URL_PARAM));
  if (q) return q;

  // 2) hash: #code=KID_XXXX или #...&code=KID_XXXX
  const hash = window.location.hash || "";
  if (hash.includes("code=")) {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const h = normalize(params.get(URL_PARAM));
    if (h) return h;
  }

  return "";
}

function stripCodeFromUrl() {
  const url = new URL(window.location.href);

  // чистим query-параметр code, но оставляем остальные
  if (url.searchParams.has(URL_PARAM)) {
    url.searchParams.delete(URL_PARAM);
    window.history.replaceState({}, "", url.toString());
    return;
  }

  // чистим hash code=..., если он там был
  const hash = window.location.hash || "";
  if (hash.includes("code=")) {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    if (params.has(URL_PARAM)) {
      params.delete(URL_PARAM);
      const next = params.toString();
      // если в hash больше ничего нет - убираем полностью
      const nextUrl =
        url.origin + url.pathname + url.search + (next ? `#${next}` : "");
      window.history.replaceState({}, "", nextUrl);
    }
  }
}

export function useKidInviteCode() {
  const [code, setCode] = useState<string>("");

  // При старте: localStorage в приоритете, URL используется как fallback.
  useEffect(() => {
    const fromLs = normalize(localStorage.getItem(LS_KEY));
    if (fromLs) {
      setCode(fromLs);
      stripCodeFromUrl();
      return;
    }

    const fromUrl = readCodeFromUrl();
    if (fromUrl) {
      localStorage.setItem(LS_KEY, fromUrl);
      setCode(fromUrl);
      stripCodeFromUrl(); // чтобы код не светился
      return;
    }
  }, []);

  const save = useCallback((next: string) => {
    const normalized = normalize(next);
    if (!normalized) return; // не сохраняем мусор
    localStorage.setItem(LS_KEY, normalized);
    setCode(normalized);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setCode("");
  }, []);

  return useMemo(() => ({ code, save, clear }), [code, save, clear]);
}
