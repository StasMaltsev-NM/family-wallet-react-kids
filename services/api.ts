// services/api.ts

// Безопасно читаем Vite env без красноты TypeScript
const API_URL: string =
  ((import.meta as any)?.env?.VITE_API_URL as string) ||
  "https://family-wallet-api.maltsevstas21.workers.dev";

type AnyJson = Record<string, any>;
type RequestOptions = RequestInit & { timeoutMs?: number };

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const isHttpUrl = (value: unknown): boolean => /^https?:\/\//i.test(asString(value));

const firstNonEmptyString = (values: unknown[]): string => {
  for (const value of values) {
    const next = asString(value);
    if (next) return next;
  }
  return "";
};

const toImageDataUrl = (base64: string): string =>
  base64.startsWith("data:image/") ? base64 : `data:image/png;base64,${base64}`;

export type KidDreamApi = {
  id?: string;
  title?: string;
  status?: string;
  target_amount?: number;
  current_amount?: number;
  icon?: string | null;
  image_url?: string | null;
  image_prompt?: string | null;
};

export type KidDreamImageResponse = {
  message?: string;
  image_url?: string | null;
  image_ready?: boolean;
  dream?: KidDreamApi | null;
};

export type KidMagicImageResponse = {
  success: boolean;
  image_url: string;
  share_url?: string;
  world?: string;
  child_name?: string;
  provider?: string;
  message?: string;
};

export const DREAM_IMAGE_PROMPT_VERSION_TAG = "FW_DREAM_PROMPT_V2_WHITE_BG";

const normalizeMagicImageResponse = (raw: AnyJson | null): KidMagicImageResponse => {
  const imageUrl = firstNonEmptyString([
    raw?.image_url,
    raw?.imageUrl,
    raw?.url,
    raw?.output_url,
    raw?.result_url,
    raw?.output?.image_url,
    raw?.output?.url,
    raw?.result?.image_url,
    raw?.result?.url,
    raw?.data?.image_url,
    raw?.data?.url,
    Array.isArray(raw?.images) ? raw?.images?.[0] : null,
    Array.isArray(raw?.output?.images) ? raw?.output?.images?.[0] : null,
    Array.isArray(raw?.data) ? raw?.data?.[0]?.image_url : null,
    Array.isArray(raw?.data) ? raw?.data?.[0]?.url : null,
    Array.isArray(raw?.output) ? raw?.output?.[0]?.image_url : null,
    Array.isArray(raw?.output) ? raw?.output?.[0]?.url : null,
  ]);

  const imageBase64 = firstNonEmptyString([
    raw?.image_base64,
    raw?.imageBase64,
    raw?.base64,
    raw?.b64_json,
    Array.isArray(raw?.images_base64) ? raw?.images_base64?.[0] : null,
    Array.isArray(raw?.data) ? raw?.data?.[0]?.b64_json : null,
    Array.isArray(raw?.output) ? raw?.output?.[0]?.b64_json : null,
  ]);

  const resolvedImage = imageUrl || (imageBase64 ? toImageDataUrl(imageBase64) : "");
  const shareUrl = firstNonEmptyString([
    raw?.share_url,
    raw?.shareUrl,
    raw?.download_url,
    raw?.downloadUrl,
    raw?.remote_url,
    raw?.remoteUrl,
    raw?.source_url,
    raw?.sourceUrl,
    raw?.original_url,
    raw?.originalUrl,
    isHttpUrl(resolvedImage) ? resolvedImage : "",
  ]);
  const success = typeof raw?.success === "boolean" ? raw.success : Boolean(resolvedImage);

  return {
    success,
    image_url: resolvedImage,
    share_url: shareUrl || undefined,
    world: asString(raw?.world) || asString(raw?.style),
    child_name: asString(raw?.child_name) || asString(raw?.childName),
    provider: asString(raw?.provider),
    message: asString(raw?.message) || asString(raw?.error),
  };
};

const isAbortError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "name" in err &&
  (err as { name?: string }).name === "AbortError";

const timeoutMessageByPath = (path: string): string =>
  path.includes("/api/magic/generate")
    ? "Генерация не завершилась вовремя. Попробуй еще раз."
    : "Сервер отвечает слишком долго. Попробуй еще раз.";

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs?: number
): Promise<Response> => {
  if (!timeoutMs || timeoutMs <= 0 || init.signal) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestUrl = `${API_URL}${path}`;
  const { timeoutMs, ...requestOptions } = options;
  const requestInit: RequestInit = {
    ...requestOptions,
    headers: {
      ...(requestOptions.headers || {}),
      // ставим content-type только когда есть body
      ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
    },
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(requestUrl, requestInit, timeoutMs);
  } catch (firstErr) {
    if (isAbortError(firstErr)) {
      throw new Error(timeoutMessageByPath(path));
    }

    // Telegram WebView иногда дает transient Load failed — повторяем один раз.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      res = await fetchWithTimeout(requestUrl, requestInit, timeoutMs);
    } catch (secondErr) {
      if (isAbortError(secondErr)) {
        throw new Error(timeoutMessageByPath(path));
      }
      throw firstErr;
    }
  }

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// --- Common ---
export function whoami(inviteCode: string) {
  return request<{
    role: "parent" | "child";
    family_id: string;
    family_name: string;
    currency: { name: string; symbol: string };
  }>("/api/auth/whoami", {
    method: "GET",
    headers: { "X-Invite-Code": inviteCode },
  });
}

// --- Parent API ---
export const parentApi = {
  getChildrenList(inviteCode: string) {
    return request<{ children: any[] }>("/api/children/list", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  getTasks(inviteCode: string) {
    return request<{ tasks: any[] }>("/api/tasks/list", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  createTask(
    inviteCode: string,
    body: {
      child_id: string;
      title: string;
      reward_amount: number;
      description?: string | null;
      recurring?: any;
      recurring_days?: any;
    }
  ) {
    return request<{ message: string; task: any }>("/api/tasks/create", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify(body),
    });
  },

  confirmTask(inviteCode: string, body: { task_id: string; action: "confirm" | "reject" }) {
    return request<{ message: string; status: string; new_balance?: number }>("/api/tasks/confirm", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify(body),
    });
  },

  // ✅ История (покупки - и миссии +)
  getHistory(inviteCode: string) {
    return request<{ history: any[] }>("/api/history", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },
};

// --- Kid API ---
export const kidApi = {
  whoami(inviteCode: string) {
    return request<any>("/api/auth/whoami", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  getTasks(inviteCode: string) {
    return request<{ tasks: any[] }>("/api/tasks/list", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  completeTask(inviteCode: string, taskId: string) {
    return request<{ message: string; status: "WAITING" | "CONFIRMED" | "IDLE"; pending_reward?: number }>(
      "/api/tasks/complete",
      {
        method: "POST",
        headers: { "X-Invite-Code": inviteCode },
        body: JSON.stringify({ task_id: taskId }),
      }
    );
  },

  listRewards(inviteCode: string) {
    return request<{ rewards: any[] }>("/api/rewards/list", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  purchaseReward(inviteCode: string, rewardId: string) {
    return request<any>("/api/rewards/purchase", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify({ reward_id: rewardId }),
    });
  },

  confirmReceived(inviteCode: string, purchaseId: string) {
    return request<{ message: string }>("/api/rewards/confirm-received", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify({ purchase_id: purchaseId }),
    });
  },

  // ✅ История (главное для Kids истории)
  getHistory(inviteCode: string) {
    return request<{ history: any[] }>("/api/history", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  getMyDream(inviteCode: string) {
    return request<{ dream: KidDreamApi | null }>("/api/dreams/my", {
      method: "GET",
      headers: { "X-Invite-Code": inviteCode },
    });
  },

  createDream(inviteCode: string, title: string) {
    return request<{ message?: string; dream?: KidDreamApi | null }>("/api/dreams/create", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify({ title }),
    });
  },

  deleteDream(inviteCode: string, dreamId: string) {
    return request<{ message?: string }>("/api/dreams/delete", {
      method: "DELETE",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify({ dream_id: dreamId }),
    });
  },

  regenerateDreamImage(inviteCode: string, dreamId: string, dreamTitle?: string) {
    const payload = JSON.stringify({
      dream_id: dreamId,
      title: dreamTitle || undefined,
    });
    const call = (path: string) =>
      request<KidDreamImageResponse>(path, {
        method: "POST",
        headers: { "X-Invite-Code": inviteCode },
        body: payload,
      });
    const isMissingRouteError = (msg: string) => {
      const normalized = msg.toLowerCase();
      return normalized.includes("http 404") || normalized.includes("not found");
    };
    const isMissingRoutePayload = (raw: AnyJson | null | undefined) => {
      const code = asString(raw?.code).toUpperCase();
      const error = asString(raw?.error).toLowerCase();
      const message = asString(raw?.message).toLowerCase();
      return code === "NOT_FOUND" || error.includes("not found") || message.includes("not found");
    };
    const callWithMissingRouteDetection = async (path: string) => {
      const response = await call(path);
      if (isMissingRoutePayload(response as AnyJson)) {
        throw new Error(`HTTP 404: Not found: ${path}`);
      }
      return response;
    };

    return callWithMissingRouteDetection("/api/dreams/regenerate-image").catch((err) => {
      const msg = err instanceof Error ? err.message : "";
      if (!isMissingRouteError(msg)) throw err;
      return callWithMissingRouteDetection("/api/dreams/generate-image");
    });
  },

  generateMagicImage(
    inviteCode: string,
    body: {
      world: string;
      photo?: string | null;
      prompt?: string;
      provider?: string;
      model?: string;
      mode?: string;
    }
  ) {
    const photo = asString(body.photo);
    const payload = {
      world: body.world,
      prompt: body.prompt,
      photo: photo || undefined,
      provider: body.provider ?? "flux2",
      model: body.model ?? "flux-2-pro",
      mode: body.mode ?? "image_to_image",
      task_type: "image_to_image",
      taskType: "image_to_image",
      edit_mode: "style_transfer",
      use_source_image: true,
    };

    if (photo) {
      console.log("[MAGIC LENS] photo payload chars:", photo.length);
    }

    return request<AnyJson>("/api/magic/generate", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify(payload),
      timeoutMs: 120000,
    })
      .then((raw) => normalizeMagicImageResponse(raw))
      .then((normalized) => {
      const provider = asString((normalized as AnyJson)?.provider).toLowerCase();
      if (photo && provider === "workers_ai_fallback") {
        throw new Error("Сервер вернул fallback-генерацию без надежного style-transfer. Попробуй еще раз.");
      }
      if (normalized.image_url) return normalized;
      const msg = normalized.message || "Не удалось применить стиль к загруженному фото";
      throw new Error(msg);
    });
  },
};
