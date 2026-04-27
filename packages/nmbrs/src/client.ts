import { XMLParser } from "fast-xml-parser";

import { NmbrsError } from "./errors";

export interface NmbrsCredentials {
  username: string;
  token: string;
  companyId: number;
}

export function getCredentialsFromEnv(): NmbrsCredentials {
  const username = process.env.NMBRS_USER;
  const token = process.env.NMBRS_TOKEN;
  const companyIdRaw = process.env.NMBRS_COMPANY_ID;
  if (!username || !token || !companyIdRaw) {
    throw new NmbrsError(
      "missing_credentials",
      "NMBRS_USER, NMBRS_TOKEN, NMBRS_COMPANY_ID ontbreken in environment",
    );
  }
  const companyId = Number.parseInt(companyIdRaw, 10);
  if (Number.isNaN(companyId)) {
    throw new NmbrsError(
      "missing_credentials",
      "NMBRS_COMPANY_ID is geen valide getal",
    );
  }
  return { username, token, companyId };
}

export function hasCredentials(): boolean {
  try {
    getCredentialsFromEnv();
    return true;
  } catch {
    return false;
  }
}

const SERVICE_URLS = {
  Employee: "https://api.nmbrs.nl/soap/v3/EmployeeService.asmx",
  Company: "https://api.nmbrs.nl/soap/v3/CompanyService.asmx",
  Hours: "https://api.nmbrs.nl/soap/v3/EmployeeService.asmx",
} as const;

const SERVICE_NS = {
  Employee: "https://api.nmbrs.nl/soap/v3/EmployeeService",
  Company: "https://api.nmbrs.nl/soap/v3/CompanyService",
  Hours: "https://api.nmbrs.nl/soap/v3/EmployeeService",
} as const;

export type NmbrsService = keyof typeof SERVICE_URLS;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
});

export interface SoapCallOptions {
  service: NmbrsService;
  action: string;
  body: string;
  creds?: NmbrsCredentials;
  timeoutMs?: number;
}

interface SoapEnvelopeShape {
  Envelope?: {
    Body?: Record<string, unknown> & {
      Fault?: { faultstring?: string; faultcode?: string };
    };
  };
}

export async function soapCall<T = Record<string, unknown>>({
  service,
  action,
  body,
  creds,
  timeoutMs = 30_000,
}: SoapCallOptions): Promise<T> {
  const c = creds ?? getCredentialsFromEnv();
  const url = SERVICE_URLS[service];
  const ns = SERVICE_NS[service];

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:nmbrs="${ns}">
  <soap:Header>
    <nmbrs:AuthHeader>
      <nmbrs:Username>${escapeXml(c.username)}</nmbrs:Username>
      <nmbrs:Token>${escapeXml(c.token)}</nmbrs:Token>
    </nmbrs:AuthHeader>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `${ns}/${action}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new NmbrsError("network_error", "Nmbrs SOAP onbereikbaar", e);
  }

  const text = await res.text();
  if (!res.ok) {
    if (
      res.status === 401 ||
      res.status === 403 ||
      text.includes("Authentication failed")
    ) {
      throw new NmbrsError(
        "auth_failed",
        "Nmbrs authenticatie mislukt — controleer credentials",
      );
    }
    throw new NmbrsError(
      "soap_fault",
      `Nmbrs SOAP fout HTTP ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  let parsed: SoapEnvelopeShape;
  try {
    parsed = xmlParser.parse(text) as SoapEnvelopeShape;
  } catch (e) {
    throw new NmbrsError("invalid_response", "Onparseerbaar SOAP-antwoord", e);
  }

  const responseBody = parsed.Envelope?.Body;
  if (!responseBody) {
    throw new NmbrsError("invalid_response", "Geen SOAP Body in response");
  }

  if (responseBody.Fault) {
    throw new NmbrsError(
      "soap_fault",
      responseBody.Fault.faultstring ?? "Onbekende SOAP fault",
    );
  }

  return responseBody as T;
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
