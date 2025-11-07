export interface AIProcessingRequest {
  action:
    | "improve"
    | "summarize"
    | "expand"
    | "translate"
    | "correct"
    | "custom";
  text: string;
  prompt?: string;
  language?: string;
}

export interface AIProcessingResponse {
  success: boolean;
  processedText?: string;
  error?: string;
}

export type AIActionType = AIProcessingRequest["action"];
