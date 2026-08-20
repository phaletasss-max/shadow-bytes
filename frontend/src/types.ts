export type LabMode = "sandbox" | "live";

export type ServiceState = "UP" | "DOWN" | "CHECKING";

export type TraceState = "idle" | "active" | "done" | "queued" | "error";

export type User = {
  user_id: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
};

export type DomainEvent = {
  event_id: string;
  event_type: string;
  source: string;
  payload: Record<string, string | number | boolean>;
  occurred_at: string;
  origin?: "sandbox" | "live";
};

export type Notification = {
  id: string;
  order_id: string;
  message: string;
  status: string;
  occurred_at: string;
};

export type ServiceHealth = {
  key: string;
  name: string;
  description: string;
  state: ServiceState;
};

export type Trace = Record<string, TraceState>;

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  concept: string;
  mission: string;
};

export type Challenge = {
  id: "sync" | "resilience" | "payment";
  title: string;
  description: string;
  action: string;
};

export type ChallengeState = "locked" | "ready" | "complete";

