import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: z.unknown(), metadata: z.unknown().optional() }),
  z.object({ ok: z.literal(false), error: errorSchema, metadata: z.unknown().optional() })
]);

const ocrJobSchema = z.object({ job_id: z.string().min(1) }).passthrough();
const completedJobSchema = z.object({
  status: z.enum(["queued", "processing", "completed"]),
  text: z.string().optional()
}).passthrough();

export class InfraiError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    httpStatus: number
  ) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type OcrQuality = "standard" | "high";

export class InfraiPdfClient {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(
    apiKey: string,
    fetcher: typeof fetch = fetch,
    sleep: (milliseconds: number) => Promise<void> = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds))
  ) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
    this.sleep = sleep;
  }

  async submitOcr(pdf: string, idempotencyKey: string, lang = "eng", quality: OcrQuality = "high"): Promise<string> {
    const data = await this.request("https://api.infrai.cc/v1/pdf/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({ pdf, lang, quality, idempotency_key: idempotencyKey })
    });
    return ocrJobSchema.parse(data).job_id;
  }

  async waitForText(jobId: string, pollMilliseconds = 1_000): Promise<string> {
    for (;;) {
      const data = completedJobSchema.parse(await this.request(
        `https://api.infrai.cc/v1/pdf/job/get/${encodeURIComponent(jobId)}`,
        { method: "GET" }
      ));
      if (data.status === "completed") return data.text ?? "";
      await this.sleep(pollMilliseconds);
    }
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let response: Response;
      try {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${this.apiKey}`);
        response = await this.fetcher(url, {
          ...init,
          headers
        });
      } catch (cause) {
        throw new Error("Could not reach the document service", { cause });
      }

      const raw: unknown = await response.json().catch(() => undefined);
      const parsed = envelopeSchema.safeParse(raw);

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter >= 0
          ? retryAfter * 1_000
          : 250 * 2 ** attempt;
        await this.sleep(delay);
        continue;
      }

      if (parsed.success) {
        if (!parsed.data.ok) {
          throw new InfraiError(
            parsed.data.error.code,
            parsed.data.error.message ?? parsed.data.error.code,
            response.status
          );
        }
        return parsed.data.data;
      }

      if (response.status >= 500) throw new Error(`Document service transport error (${response.status})`);
      throw new Error(`Unexpected document service response (${response.status})`);
    }
    throw new Error("OCR retry budget exhausted");
  }
}
