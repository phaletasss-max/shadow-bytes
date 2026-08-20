import type { DomainEvent, Notification, Product, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

type ApiErrorPayload = { detail?: string | Record<string, unknown> };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string | Record<string, unknown> | undefined,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    const message = typeof payload.detail === "string"
      ? payload.detail
      : `La solicitud fue rechazada (${response.status}).`;
    throw new ApiError(message, response.status, payload.detail);
  }
  return payload;
}

export const api = {
  login: (email: string, password: string) => request<{ access_token: string; user: User }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  ),
  me: (token: string) => request<User>("/auth/me", {}, token),
  products: () => request<Product[]>("/products/products"),
  createOrder: (
    productId: string,
    quantity: number,
    simulatePaymentFailure: boolean,
    token: string,
  ) => request<Record<string, unknown>>(
    "/orders/orders",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        quantity,
        simulate_payment_failure: simulatePaymentFailure,
      }),
    },
    token,
  ),
  events: () => request<DomainEvent[]>("/reports/reports/events"),
  notifications: () => request<Notification[]>("/notifications/notifications"),
  serviceHealth: (key: string) => request<{ status: "UP" }>(`/monitor/${key}`),
};

