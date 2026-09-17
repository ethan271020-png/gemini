// netlify/functions/chat.js
//
// Receives { messages: [{role: 'user'|'assistant', content: string}], model: string }
// from the front end, calls the Gemini API, and returns { reply: string }.
//
// Requires an environment variable GEMINI_API_KEY to be set in the Netlify
// site settings (Site configuration -> Environment variables). Get a key at
// https://aistudio.google.com/app/apikey

const ALLOWED_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro']);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'שיטת בקשה לא נתמכת.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return respond(500, {
      error: 'לא הוגדר מפתח API בצד השרת. הוסיפו משתנה סביבה בשם GEMINI_API_KEY בהגדרות האתר בנטליפיי.',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { error: 'גוף הבקשה אינו JSON תקין.' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return respond(400, { error: 'לא נשלחו הודעות.' });
  }

  const model = ALLOWED_MODELS.has(body.model) ? body.model : 'gemini-2.5-flash';

  // Map our {role, content} history to Gemini's {role, parts} format.
  // Gemini uses 'model' instead of 'assistant', and the first entry must be 'user'.
  const contents = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const message = data?.error?.message || 'שגיאה לא ידועה מול ה-API.';
      return respond(geminiRes.status, { error: translateApiError(geminiRes.status, message) });
    }

    const candidate = data?.candidates?.[0];
    const reply = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';

    if (!reply) {
      const finishReason = candidate?.finishReason;
      if (finishReason === 'SAFETY') {
        return respond(200, { error: 'התשובה נחסמה על ידי מסנני הבטיחות של המודל.' });
      }
      return respond(200, { error: 'לא התקבלה תשובה מהמודל. נסו לנסח מחדש את ההודעה.' });
    }

    return respond(200, { reply });
  } catch (err) {
    return respond(500, { error: 'שגיאת שרת: ' + err.message });
  }
};

function translateApiError(status, message) {
  if (status === 400) return 'בקשה שגויה מול ה-API: ' + message;
  if (status === 403) return 'מפתח ה-API לא תקין או חסום.';
  if (status === 429) return 'חריגה ממכסת הבקשות. נסו שוב בעוד רגע.';
  return 'שגיאה מול ה-API: ' + message;
}

function respond(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
