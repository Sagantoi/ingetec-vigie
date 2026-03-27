exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Clé API manquante' }) };
  }

  try {
    const { type, category, description, location, imageBase64, expertNotes, diagCorrection, aiAnalysis } = JSON.parse(event.body);

    const catLabels = {
      chaussee: "Chaussées & revêtements",
      ouvrage: "Ouvrages d'art",
      signalisation: "Signalisation & équipements",
      glissement: "Glissements / instabilités"
    };

    let prompt = '';
    let messages = [];

    if (type === 'analyze') {
      prompt = `Tu es un expert senior en infrastructure routière chez Ingetec.
Catégorie : ${catLabels[category] || category}
Localisation : ${location || "Non précisée"}
Description : ${description}

Réponds UNIQUEMENT en JSON valide (sans backticks) :
{
  "synthese": "Résumé technique en 2-3 phrases",
  "diagnostic": "Diagnostic de la pathologie observée",
  "urgence": "faible|modere|elevee|critique",
  "risques": ["risque 1", "risque 2", "risque 3"],
  "actions_immediates": ["action 1", "action 2"],
  "recommandations_expert": "Ce que l'expert Ingetec devrait approfondir",
  "normes_applicables": ["norme 1", "norme 2"]
}`;

      if (imageBase64) {
        messages.push({
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: prompt }
          ]
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

    } else if (type === 'expert') {
      prompt = `Tu es un expert senior chez Ingetec, spécialisé en infrastructures routières.
Pré-analyse IA : ${JSON.stringify(aiAnalysis)}
Notes de l'expert : ${expertNotes}
${diagCorrection ? `Correction du diagnostic par l'expert : ${diagCorrection}` : ''}

Réponds UNIQUEMENT en JSON valide :
{
  "avis_officiel": "Avis technique complet (4-5 phrases)",
  "conclusion": "Conclusion et recommandation finale",
  "suites_a_donner": ["action 1", "action 2", "action 3"],
  "delai_intervention": "délai recommandé",
  "niveau_intervention": "surveillance|entretien|réparation urgente|reconstruction"
}`;
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: data.error?.message || 'Erreur API' }) };
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
