exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
  }
  try {
    const { imageBase64, mimeType, denomList } = JSON.parse(event.body);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } },
          { type: "text", text: `You are an expert poker chip counter. Carefully analyze this image and count every visible poker chip.\n\nThe chip denominations in this game are: ${denomList}\n\nInstructions:\n- Count EACH chip individually, including chips in stacks (estimate stack heights carefully)\n- Identify chips by their COLOR first, then match to the denomination list\n- If chips are stacked, look at the edges/sides to count how many are in each stack\n- Be precise — scan the entire image systematically left to right, top to bottom\n- If you can't clearly see a chip color, make your best guess\n\nReturn ONLY a JSON object with no markdown, no explanation:\n{"counts":{"White":12,"Red":5,"Blue":2},"notes":"brief description of what you saw"}` }
        ]}]
      })
    });
    const data = await response.json();
    if (data.error) return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    const text = data.content?.[0]?.text || "";
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
