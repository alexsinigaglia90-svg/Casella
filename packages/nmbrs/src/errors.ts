export type NmbrsErrorCode =
  | "missing_credentials"
  | "auth_failed"
  | "network_error"
  | "soap_fault"
  | "invalid_response"
  | "not_found"
  | "not_implemented";

export class NmbrsError extends Error {
  readonly code: NmbrsErrorCode;

  constructor(code: NmbrsErrorCode, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "NmbrsError";
    this.code = code;
  }
}
