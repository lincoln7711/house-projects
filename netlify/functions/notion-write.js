export default async function(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const { id, status, priority } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing page id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const properties = {};
  if (status)   properties['Status']          = { select: { name: status } };
  if (priority) properties['Manual Priority'] = { select: { name: priority } };

  let notionRes;
  try {
    notionRes = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11'
      },
      body: JSON.stringify({ properties })
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const text = await notionRes.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: 'Unparseable response', raw: text }; }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export const config = { path: '/.netlify/functions/notion-write' };
