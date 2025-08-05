
export enum PassportStatus {
  DONE = "DONE",
  PROCESSING = "PROCESSING",
  ERROR = "ERROR",
  NOT_FOUND = "NOT_FOUND",
}

export interface Passport {
  address: string;
  score: number | null; // Score can be null when processing
  status: "DONE" | "PROCESSING" | "ERROR" | "NOT_FOUND";
  last_score_timestamp: string;
  expiration_date?: string;
  evidence?: {
    type: string;
    success: boolean;
    rawScore: number;
    threshold: number;
  };
  error?: string;
  stamp_scores?: Record<string, any>;
  passport?: {
    address: string;
  };
}
