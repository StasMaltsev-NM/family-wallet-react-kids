// services/api.ts

// Безопасно читаем Vite env без красноты TypeScript
const API_URL: string =
  ((import.meta as any)?.env?.VITE_API_URL as string) ||
  "https://family-wallet-api.maltsevstas21.workers.dev";

type AnyJson = Record<string, any>;

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

  generateMagicImage(
    inviteCode: string,
    body: { world: string; photo?: string | null; prompt?: string }
  ) {
    return request<{
      success: boolean;
      image_url: string;
      world: string;
      child_name: string;
    }>("/api/magic/generate", {
      method: "POST",
      headers: { "X-Invite-Code": inviteCode },
      body: JSON.stringify(body),
    });
  },
};
