import { getStore } from "@netlify/blobs";

/**
 * Netlify Function:
 * - POST from Pathfinder: store latest payload
 * - GET from browser: return latest payload as JSON
 */
export default async (req, context) => {
  const store = getStore("pathfinder-commands");

  if (req.method === "POST") {
    const bodyText = await req.text();

    let parsed = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      // Pathfinder might send plain text, that’s fine
    }

    const payload = {
      receivedAt: new Date().toISOString(),
      rawBody: bodyText,
      json: parsed,
      headers: Object.fromEntries(req.headers),
      path: req.url,
      method: req.method
    };

    await store.setJSON("latest", payload);

    return new Response("OK", { status: 200 });
  }

  if (req.method === "GET") {
    const latest = await store.get("latest", { type: "json" });

    return new Response(
      JSON.stringify(
        latest || { error: "No Pathfinder POST received yet." },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  return new Response("Method not allowed", { status: 405 });
};
