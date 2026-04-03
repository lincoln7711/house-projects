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
  const DATABASE_ID  = process.env.DATABASE_ID;

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }

  const { properties } = body;

  let notionRes;
  try {
    notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties
      })
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach Notion API', detail: err.message }), {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }

  const text = await notionRes.text();

  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export const config = {
  path: "/.netlify/functions/notion"
};
// cache bust Fri Apr  3 11:14:05 AM EDT 2026
