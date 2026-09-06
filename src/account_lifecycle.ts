import { z } from "zod";
import type { InfraiPdfClient } from "./infrai_pdf.js";

export const onboardingRequestSchema = z.object({
  tenantId: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  legalName: z.string().min(2).max(160),
  documentPdf: z.string().min(20),
  documentRevision: z.string().min(1).max(40)
}).strict();

export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
export type AccountState = "pending_documents" | "needs_admin_review" | "active";

export interface OnboardingResult {
  tenantId: string;
  state: AccountState;
  searchableText: string;
  adminNote: string;
}

export function decideAccountState(legalName: string, searchableText: string): Pick<OnboardingResult, "state" | "adminNote"> {
  const normalizedText = searchableText.toLocaleLowerCase();
  const normalizedName = legalName.toLocaleLowerCase();
  const namesTenant = normalizedText.includes(normalizedName);
  const hasEffectiveAgreement = /agreement\s+(is\s+)?effective|effective\s+date/.test(normalizedText);

  if (namesTenant && hasEffectiveAgreement) {
    return { state: "active", adminNote: "Agreement text matches the tenant and includes an effective term." };
  }
  return { state: "needs_admin_review", adminNote: "Review the tenant name and effective term in the extracted text." };
}

export async function onboardTenant(
  input: OnboardingRequest,
  pdfClient: Pick<InfraiPdfClient, "submitOcr" | "waitForText">
): Promise<OnboardingResult> {
  const idempotencyKey = `tenant-${input.tenantId}-document-${input.documentRevision}`;
  const jobId = await pdfClient.submitOcr(input.documentPdf, idempotencyKey);
  const searchableText = await pdfClient.waitForText(jobId);
  return {
    tenantId: input.tenantId,
    searchableText,
    ...decideAccountState(input.legalName, searchableText)
  };
}
