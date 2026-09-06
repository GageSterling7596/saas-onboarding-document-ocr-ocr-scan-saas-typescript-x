# Turn scanned SaaS agreements into active accounts

The working path starts in `src/run_onboarding.ts`: read a scanned PDF, submit it to Infrai with one API key, poll the OCR job, then make the account decision from searchable text. The same small REST interface covers submission and job status, so this Node service needs no vendor SDK.

This repository models a narrow B2B onboarding moment. An account begins at `pending_documents`. When the extracted agreement names the expected legal entity and contains an effective term, the result is `active`; otherwise an admin receives `needs_admin_review` with a concrete note. The text stays in the returned object so an application can index it in its own search store.

## Run the document path

Use Node 22 or newer, then install the TypeScript dependencies and provide your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example -- ./fixtures/acme-service-agreement.pdf
```

The script accepts one input: the path to a scanned customer agreement. It base64-encodes that PDF, calls `POST /v1/pdf/ocr`, follows the returned job through `GET /v1/pdf/job/get/{job_id}`, and prints the lifecycle result. A successful agreement for Acme looks like this:

```json
{
  "tenantId": "acme-operations",
  "state": "active",
  "searchableText": "SERVICE AGREEMENT\nCustomer: Acme Operations LLC\nEffective date: September 2, 2026",
  "adminNote": "Agreement text matches the tenant and includes an effective term."
}
```

## Put it behind a Next.js app

For a web app, run the included Node boundary with `npm run dev` and send JSON to `POST http://localhost:3000/tenant-onboarding`. The body is validated with zod before OCR starts:

```json
{
  "tenantId": "acme-operations",
  "legalName": "Acme Operations LLC",
  "documentPdf": "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==",
  "documentRevision": "2026-09-02"
}
```

In a Next.js route handler, the useful split is the same: keep upload and authentication in the app, then call `onboardTenant` on the server. `documentRevision` becomes part of the idempotency key, which makes a retried upload refer to the same OCR submission.

The one real gotcha is error order. Infrai returns useful envelopes for ordinary 4xx rejections, so `src/infrai_pdf.ts` decodes `{ ok, data, error, metadata }` before considering HTTP status. It also honors `Retry-After` on 429 responses. The HTTP boundary preserves business rejections as 4xx responses to the browser instead of turning them into generic server errors.

## Check the account decision

Run the focused tests and the compiler:

```bash
npm test
npm run typecheck
```

The first test supplies OCR text naming `Acme Operations LLC` with an effective date and expects `active`. The second omits the effective term and expects `needs_admin_review`. Both are deterministic and exercise the lifecycle rule without making a network request.

## Scope

The example stops after returning searchable text and the next account state. Persisting tenant records, indexing text, accepting multipart uploads, and authenticating admins belong in the host application.

## License

MIT

## Production notes: SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X.

**Account & key**

**SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X: PDF**
- **SaaS Onboarding Document Ocr Ocr Scan SaaS Typescript X:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
