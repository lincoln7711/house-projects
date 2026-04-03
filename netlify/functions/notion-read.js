export default async function(req, context) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = '3342f562-1e20-804a-92a7-d15c70038350';

  let results = [];
  let cursor = undefined;

  do {
    const body = { filter: { property: 'object', value: 'page' }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const filtered = (data.results || []).filter(page => {
      const isOurDb = page.parent?.data_source_id != null ||
                      page.parent?.database_id === DATABASE_ID;
      const currentWork = page.properties?.['Current Work?']?.checkbox === true;
      const status = page.properties?.['Status']?.select?.name || '';
      const notCompleted = status !== 'Completed';
      return isOurDb && currentWork && notCompleted;
    });

    results = results.concat(filtered);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  results.sort((a, b) => {
    const pa = a.properties?.['Priority (displayed)']?.formula?.string || 'P4';
    const pb = b.properties?.['Priority (displayed)']?.formula?.string || 'P4';
    return pa.localeCompare(pb);
  });

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export const config = { path: '/.netlify/functions/notion-read' };
