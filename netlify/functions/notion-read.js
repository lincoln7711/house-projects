export default async function(req, context) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = '3342f5621e20810d8bbe000bb5caa0ee';

  const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2026-03-11'
    },
    body: JSON.stringify({
      filter: {
        property: 'Current Work?',
        checkbox: { equals: true }
      }
    })
  });

  const text = await notionRes.text();

  return new Response(JSON.stringify({ status: notionRes.status, body: text.substring(0, 1000) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export const config = { path: '/.netlify/functions/notion-read' };
