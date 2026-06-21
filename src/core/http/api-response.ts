import { HttpError } from "@/core/http/http-error";

type ApiEnvelope<TData> = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: TData;
};

export function unwrapApiData<TData>(response: ApiEnvelope<TData>): TData {
  if (!response.success || response.data === undefined) {
    throw new HttpError(
      response.message ?? "FitMatch API returned an invalid response",
      500,
      response.code ?? "INVALID_API_RESPONSE",
      undefined,
      response,
    );
  }

  return response.data;
}
