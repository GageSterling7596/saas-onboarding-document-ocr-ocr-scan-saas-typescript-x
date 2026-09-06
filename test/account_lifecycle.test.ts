import assert from "node:assert/strict";
import test from "node:test";
import { onboardTenant } from "../src/account_lifecycle.js";

test("activates a tenant when OCR text names it and establishes an effective agreement", async () => {
  const calls: string[] = [];
  const result = await onboardTenant({
    tenantId: "acme-operations",
    legalName: "Acme Operations LLC",
    documentPdf: "data:application/pdf;base64,JVBERi0xLjQK",
    documentRevision: "rev-7"
  }, {
    async submitOcr(_pdf, key) {
      calls.push(key);
      return "job-42";
    },
    async waitForText(jobId) {
      assert.equal(jobId, "job-42");
      return "SERVICE AGREEMENT\nCustomer: Acme Operations LLC\nEffective date: September 2, 2026";
    }
  });

  assert.equal(result.state, "active");
  assert.match(result.searchableText, /Acme Operations LLC/);
  assert.deepEqual(calls, ["tenant-acme-operations-document-rev-7"]);
});

test("routes an incomplete agreement to admin review", () => {
  return onboardTenant({
    tenantId: "acme-operations",
    legalName: "Acme Operations LLC",
    documentPdf: "data:application/pdf;base64,JVBERi0xLjQK",
    documentRevision: "rev-8"
  }, {
    async submitOcr() { return "job-43"; },
    async waitForText() { return "Scanned cover sheet for Acme Operations LLC"; }
  }).then((result) => assert.equal(result.state, "needs_admin_review"));
});
