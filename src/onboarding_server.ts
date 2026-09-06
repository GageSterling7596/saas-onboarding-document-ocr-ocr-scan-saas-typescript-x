import { createServer } from "node:http";
import { InfraiError, InfraiPdfClient } from "./infrai_pdf.js";
import { onboardTenant, onboardingRequestSchema } from "./account_lifecycle.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const client = new InfraiPdfClient(apiKey);
const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST" || request.url !== "/tenant-onboarding") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const decoded: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const input = onboardingRequestSchema.parse(decoded);
    const result = await onboardTenant(input, client);
    response.writeHead(200).end(JSON.stringify(result));
  } catch (error) {
    if (error instanceof InfraiError) {
      const status = error.httpStatus >= 400 && error.httpStatus < 500 ? error.httpStatus : 502;
      response.writeHead(status).end(JSON.stringify({ error: error.code, message: error.message }));
      return;
    }
    const validation = error instanceof Error && error.name === "ZodError";
    response.writeHead(validation ? 400 : 500).end(JSON.stringify({
      error: validation ? "Invalid onboarding request" : "Onboarding request failed"
    }));
  }
});

server.listen(port, () => console.log(`Tenant onboarding service listening on http://localhost:${port}`));
