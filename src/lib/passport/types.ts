
export enum PassportStatus {
    PROCESSING,
    DONE,
    ERROR,
}
export interface Passport {
  score: number;
  passing_score: boolean;
  address: string;
  status: "DONE" | "PROCESSING" | "ERROR";
  error?: string;
  last_score_timestamp: string;
}
