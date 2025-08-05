
export interface Passport {
  score: number;
  address: string;
  status: "DONE" | "PROCESSING" | "ERROR" | "NOT_FOUND";
  error?: string;
  last_score_timestamp: string;
}
