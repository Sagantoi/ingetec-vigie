const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    // ✅ client déclaré ici, accessible partout
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (body.type === 'analyze') {
      // ... ton code inchangé
    }

    if (body.type === 'expert') {
      // ... ton code inchangé, client est maintenant accessible
    }
  }
}
