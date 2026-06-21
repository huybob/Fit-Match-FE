import { AppError } from "@/shared/errors/app-error";
import { HttpError } from "@/core/http/http-error";

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export function getErrorCode(error: unknown) {
  if (error instanceof AppError || error instanceof HttpError) {
    return error.code;
  }

  return "UNKNOWN_ERROR";
}

export function getErrorStatus(error: unknown) {
  if (error instanceof AppError || error instanceof HttpError) {
    return error.statusCode;
  }

  return 0;
}
