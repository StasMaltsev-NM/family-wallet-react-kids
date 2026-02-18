// services/api.ts

// Безопасно читаем Vite env без красноты TypeScript
const API_URL: string =
  ((import.meta as any)?.env?.VITE_API_URL as string) ||
  "https://family-wallet-api.maltsevstas21.workers.dev";

type AnyJson = Record<string, any>;

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const firstNonEmptyString = (values: unknown[]): string => {
  for (const value of values) {
    const next = asString(value);
    if (next) return next;
  }
  return "";
};

const toImageDataUrl = (base64: string): string =>
  base64.startsWith("data:image/") ? base64 : `data:image/png;base64,${base64}`;

const extractBase64 = (value: string): string => {
  const normalized = asString(value);
  const separator = normalized.indexOf(",");
  return separator >= 0 ? normalized.slice(separator + 1) : normalized;
};

const parseApiResponse = async (res: Response): Promise<AnyJson> => {
  const text = await res.text();
  let data: AnyJson | null = null;
  try {
    data = text ? (JSON.parse(text) as AnyJson) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data || {};
};

const dataUrlToBlob = (dataUrl: string): Blob | null => {
  const normalized = asString(dataUrl);
  if (!normalized.startsWith("data:image/")) return null;
  const match = normalized.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || "image/jpeg";
  const base64 = match[2] || "";
  if (!base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
};

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
  world?: string;
  child_name?: string;
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
  const success = typeof raw?.success === "boolean" ? raw.success : Boolean(resolvedImage);

  return {
    success,
    image_url: resolvedImage,
    world: asString(raw?.world) || asString(raw?.style),
    child_name: asString(raw?.child_name) || asString(raw?.childName),
    message: asString(raw?.message) || asString(raw?.error),
  };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      // ставим content-type только когда есть body
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

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

    return call("/api/dreams/regenerate-image").catch((err) => {
      const msg = err instanceof Error ? err.message : "";
      if (!isMissingRouteError(msg)) throw err;
      return call("/api/dreams/generate-image");
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
    const photoBase64 = photo ? extractBase64(photo) : "";
    const isDataImage = photo.startsWith("data:image/");
    const photoUrl = !isDataImage ? photo : "";

    const payload = {
      ...body,
      provider: body.provider ?? "flux2",
      model: body.model ?? "flux-2-pro",
      mode: body.mode ?? "image_to_image",
      task_type: "image_to_image",
      taskType: "image_to_image",
      edit_mode: "style_transfer",
      use_source_image: true,
      photo: photo || undefined,
      image: photo || undefined,
      input_image: photo || undefined,
      source_image: photo || undefined,
      photo_base64: photoBase64 || undefined,
      image_base64: photoBase64 || undefined,
      input_image_base64: photoBase64 || undefined,
      image_url: photoUrl || undefined,
      input_url: photoUrl || undefined,
      input_urls: photo ? [photo] : undefined,
    };

    const callJson = () =>
      request<AnyJson>("/api/magic/generate", {
        method: "POST",
        headers: { "X-Invite-Code": inviteCode },
        body: JSON.stringify(payload),
      }).then((raw) => normalizeMagicImageResponse(raw));

    const callMultipart = async (): Promise<KidMagicImageResponse> => {
      if (!photo) throw new Error("empty photo");
      const form = new FormData();
      form.set("world", asString(body.world));
      form.set("prompt", asString(body.prompt));
      form.set("provider", asString(payload.provider));
      form.set("model", asString(payload.model));
      form.set("mode", asString(payload.mode));
      form.set("task_type", "image_to_image");
      form.set("taskType", "image_to_image");
      form.set("use_source_image", "true");
      form.set("photo", photo);
      form.set("image", photo);
      form.set("input_image", photo);
      form.set("source_image", photo);
      if (photoBase64) {
        form.set("photo_base64", photoBase64);
        form.set("image_base64", photoBase64);
        form.set("input_image_base64", photoBase64);
      }
      if (photoUrl) {
        form.set("image_url", photoUrl);
        form.set("input_url", photoUrl);
      }
      const blob = dataUrlToBlob(photo);
      if (blob) form.set("photo_file", blob, "magic-source.jpg");

      const res = await fetch(`${API_URL}/api/magic/generate`, {
        method: "POST",
        headers: { "X-Invite-Code": inviteCode },
        body: form,
      });
      const raw = await parseApiResponse(res);
      return normalizeMagicImageResponse(raw);
    };

    return callMultipart()
      .catch((err) => {
        console.warn("[MAGIC LENS] multipart fallback to json:", err instanceof Error ? err.message : err);
        return callJson();
      })
      .then((normalized) => {
        if (normalized.image_url) return normalized;
        return callJson();
      });
  },
};
