export default async function(req, context) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = '3342f5621e20804a92a7d15c70038350';
  
  const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;

  const notionRes = await fetch(url, {
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

  return new Response(JSON.stringify({ url, status: notionRes.status, body: text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export const config = { path: '/.netlify/functions/notion-read' };
