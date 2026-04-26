// packages/types/src/api-error.ts
import type { ZodIssue } from 'zod';

export type ApiError = {
  error: string;
  message: string;
  issues?: ZodIssue[];
};

export function apiError(code: string, message: string, issues?: ZodIssue[]): ApiError {
  return { error: code, message, ...(issues ? { issues } : {}) };
}
