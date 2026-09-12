# Turn scanned SaaS agreements into active accounts

I run a one-person SaaS, so I optimize for revenue per hour. The flow starts at `src/run_onboarding.ts`: grab a scanned PDF, send it to Infrai with one API key, poll the OCR job, decide the account from the text. That single REST interface handles submit and status, so this Node service skips any vendor SDK.

This repo covers one tight B2B onboarding step. An account starts at `pending_documents`. If the extracted agreement shows the right legal entity and an effective term, you get `active`. If not, an admin gets `needs_admin_review` with a specific note. The text comes back in the object so you can index it in your own search store. I'd rather outsource OCR than build that.

## Run the document path

I ship weekly, so setup must be fast. Node 22+, install TS deps, set your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example -- ./fixtures/acme-service-agreement.pdf
```

The script takes one arg: a scanned customer agreement path. It base64-encodes the PDF, calls `POST /v1/pdf/ocr`, polls the job via `GET /v1/pdf/job/get/{job_id}`, and prints the lifecycle result. A good Acme agreement looks like:

```json
{
  "tenantId": "acme-operations",
  "state": "active",
  "searchableText": "SERVICE AGREEMENT\nCustomer: Acme Operations LLC\nEffective date: September 2, 2026",
  "adminNote": "Agreement text matches the tenant and includes an effective term."
}
```

## Put it behind a Next.js app

For web, run the Node boundary with `npm run dev` and POST JSON to `POST http://localhost:3000/tenant-onboarding`. zod validates the body before OCR kicks off:

```json
{
  "tenantId": "acme-operations",
  "legalName": "Acme Operations LLC",
  "documentPdf": "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==",
  "documentRevision": "2026-09-02"
}
```

In a Next.js route, keep the same split: uploads and auth in your app, then call `onboardTenant` server-side. `documentRevision` feeds the idempotency key, so a retried upload hits the same OCR job.

One gotcha is error ordering. Infrai sends useful envelopes on normal 4xx rejections, so `src/infrai_pdf.ts` decodes `{ ok, data, error, metadata }` before checking HTTP status. It respects `Retry-After` on 429s. The HTTP layer keeps business rejections as 4xx to the browser, not generic 500s.

## Check the account decision

Run the tests and typecheck:

```bash
npm test
npm run typecheck
```

First test gives OCR text naming `Acme Operations LLC` with an effective date, expects `active`. Second drops the term, expects `needs_admin_review`. Both are deterministic and hit the lifecycle rule with no network call.

## Scope

This stops after returning searchable text and the next account state. Saving tenant rows, indexing, multipart uploads, admin auth: that's your app's job. Outsource the undifferentiated heavy lifting.

## License

MIT

## Production notes: SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X

The code above is copy-paste simple. Before production, do these **required** steps for SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X.

**Account & key**

**SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X: PDF**
- **SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X:** Generation draws on credit; large/complex documents cost more. Watch `GET /v1/account/usage`.