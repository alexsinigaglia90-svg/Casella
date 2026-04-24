export type PdokErrorCode = "timeout" | "http" | "no_results" | "schema";

export class PdokError extends Error {
  readonly code: PdokErrorCode;
  readonly status?: number;

  constructor(
    code: PdokErrorCode,
    message: string,
    options?: { status?: number; cause?: unknown }
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined
    );
    this.name = "PdokError";
    this.code = code;
    if (options?.status !== undefined) this.status = options.status;
  }
}
