import type { ApplicationStatus } from "@/lib/statuses";

export type StatusEvent = {
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
};

export type ApplicationRecord = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  source: string | null;
  status: ApplicationStatus;
  applied_on: string | null;
  notes: string | null;
  events: StatusEvent[];
  created_at: string;
  updated_at: string;
};


export type SankeyNode = {
  name: string;
};

export type SankeyLink = {
  source: number;
  target: number;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};
