import { AppError } from "@/shared/errors/app-error";

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export function getErrorCode(error: unknown) {
  if (error instanceof AppError) {
    return error.code;
  }

  return "UNKNOWN_ERROR";
}
