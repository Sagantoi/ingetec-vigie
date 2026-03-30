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
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (body.type === 'analyze') {
      const { category, description, location, imageBase64 } = body;
      const content = [];
      if (imageBase64) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
        });
      }
      content.push({
        type: 'text',
        text: `Tu es un ingenieur expert en infrastructures routieres et genie civil pour Ingetec Vigie.

Analyse ce signalement :
- Categorie : ${category}
- Localisation : ${location || 'Non precisee'}
- Description : ${description}

Reponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :
{
  "diagnostic": "Nom precis du probleme (ex: Faience de surface, Nid-de-poule isole)",
  "urgence": "faible",
  "synthese": "Synthese technique en 2-3 phrases claires pour le gestionnaire",
  "recommandations_expert": "Action principale recommandee (1 phrase)",
  "risques": ["risque 1", "risque 2"],
  "actions_immediates": ["action 1", "action 2"],
  "normes_applicables": ["norme 1", "norme 2"]
}

Pour le champ urgence, utilise uniquement : faible, modere, elevee, ou critique.`
      });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content }]
      });

      const text = response.content[0].text.trim();
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    if (body.type === 'expert') {
      const { category, expertNotes, diagCorrection, aiAnalysis } = body;
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `Tu es un expert Ingetec redigeant un avis technique officiel.

Categorie : ${category}
Diagnostic IA initial : ${aiAnalysis?.diagnostic || 'N/A'}
${diagCorrection ? `Correction apportee par l'expert : ${diagCorrection}` : ''}
Notes de l'expert terrain : ${expertNotes}

Reponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :
{
  "avis_officiel": "Avis technique complet et officiel en 3-4 phrases",
  "niveau_intervention": "Curatif urgent",
  "delai_intervention": "Sous 1 semaine",
  "suites_a_donner": ["action 1", "action 2", "action 3"],
  "conclusion": "Conclusion synthetique et recommandation finale"
}

Pour niveau_intervention, utilise : Preventif, Curatif urgent, Curatif planifiable, ou Surveillance.
Pour delai_intervention, utilise : Immediat (< 24h), Sous 1 semaine, Sous 1 mois, ou Planifiable.`
        }]
      });

      const text = response.content[0].text.trim();
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Type invalide' }) };

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Erreur serveur' })
    };
  }
};
