import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("pathfinder-commands");

  // Read ?slot=1..10 (default to "1" if missing)
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot") || "1";
  const key = `slot-${slot}`; // 🔑 each slot has its own key

  if (req.method === "POST") {
    const bodyText = await req.text();

    let parsed = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      // it's fine if not JSON, we still store rawBody
    }

    const payload = {
      receivedAt: new Date().toISOString(),
      rawBody: bodyText,
      json: parsed
    };

    // 🔐 store per-slot
    await store.setJSON(key, payload);

    return new Response("OK", { status: 200 });
  }

  if (req.method === "GET") {
    // 🔍 read per-slot
    const latest = await store.get(key, { type: "json" });

    return new Response(
      JSON.stringify(
        latest || { error: `No data yet for slot ${slot}.` },
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
