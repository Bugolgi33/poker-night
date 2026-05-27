exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const id = event.queryStringParameters?.id;
  if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || "";
  const url = rawUrl.replace(/['"]/g, "").replace(/\/+$/, "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").replace(/['"]/g, "").trim();

  if (!url || !token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Upstash not configured." }) };
  }

  const key = `poker:room:${id}`;
  const authHeader = { Authorization: `Bearer ${token}` };

  if (event.httpMethod === "GET") {
    try {
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: authHeader });
      const j = await r.json();
      if (!j.result || j.result === "nil") return { statusCode: 200, headers, body: JSON.stringify(null) };
      return { statusCode: 200, headers, body: j.result };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const data = event.body;
      const r = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify([["SET", key, data, "EX", 86400]]),
      });
      const j = await r.json();
      if (j.error) return { statusCode: 500, headers, body: JSON.stringify({ error: j.error }) };
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: "Method not allowed" };
};
