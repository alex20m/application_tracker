import type { ApplicationStatus } from "@/lib/statuses";

export type ApplicationRecord = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  source: string | null;
  status: ApplicationStatus;
  applied_on: string | null;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type StatusEventRecord = {
  id: string;
  application_id: string;
  user_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
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
