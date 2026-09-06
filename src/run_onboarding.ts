import { readFile } from "node:fs/promises";
import { InfraiPdfClient } from "./infrai_pdf.js";
import { onboardTenant } from "./account_lifecycle.js";

const apiKey = process.env.INFRAI_API_KEY;
const pdfPath = process.argv[2];
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");
if (!pdfPath) throw new Error("Pass a scanned agreement PDF path");

const pdf = await readFile(pdfPath);
const result = await onboardTenant({
  tenantId: "acme-operations",
  legalName: "Acme Operations LLC",
  documentPdf: `data:application/pdf;base64,${pdf.toString("base64")}`,
  documentRevision: "2026-09-02"
}, new InfraiPdfClient(apiKey));

console.log(JSON.stringify(result, null, 2));
