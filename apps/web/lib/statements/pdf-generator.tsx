import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";

import { MortgageTemplate } from "./templates/mortgage";
import { OtherTemplate } from "./templates/other";
import { RentTemplate } from "./templates/rent";

export interface StatementGenerateInput {
  purpose: "mortgage" | "rent" | "other";
  employee: {
    fullName: string;
    jobTitle: string;
    startDate: string;
    endDate: string | null;
    brutoSalarisMaandCents: number | null;
    vakantietoeslagPct: string | null;
  };
  employer: { name: string; kvk: string; address: string };
  signature: { signedBy: string; signedAt: string; locationCity?: string };
  purposeData: {
    nhgIndicator?: boolean | null;
    lenderName?: string | null;
    loanAmountIndicativeCents?: number | null;
    landlordName?: string | null;
    landlordAddress?: string | null;
    monthlyRentCents?: number | null;
    purposeOtherReason?: string | null;
  };
}

export async function generateStatementPdf(
  input: StatementGenerateInput,
): Promise<Buffer> {
  if (input.purpose === "mortgage") {
    return renderToBuffer(
      <MortgageTemplate
        employer={input.employer}
        employee={input.employee}
        signature={input.signature}
        purposeData={input.purposeData}
      />,
    );
  }
  if (input.purpose === "rent") {
    return renderToBuffer(
      <RentTemplate
        employer={input.employer}
        employee={input.employee}
        signature={input.signature}
        purposeData={input.purposeData}
      />,
    );
  }
  return renderToBuffer(
    <OtherTemplate
      employer={input.employer}
      employee={input.employee}
      signature={input.signature}
      purposeData={input.purposeData}
    />,
  );
}
