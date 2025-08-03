
export enum PassportStatus {
    DONE = "DONE",
    ERROR = "ERROR",
    PROCESSING = "PROCESSING"
}
export interface Passport {
  score: number;
  isEligible: boolean;
  address: string;
  status: PassportStatus;
  error?: string;
  last_score_timestamp: string;
}
