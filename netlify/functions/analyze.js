exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: "Analyze endpoint is reachable. Send a POST request to use it.",
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
      })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Method not allowed"
      })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: "POST received successfully",
        received: payload
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Invalid JSON body"
      })
    };
  }
};
