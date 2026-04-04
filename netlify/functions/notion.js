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

  const NOTION_TOKEN  = process.env.NOTION_TOKEN;
  const DATABASE_ID   = process.env.DATABASE_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }

  const { properties, details } = body;

  const payload = {
    parent: { database_id: DATABASE_ID },
    properties
  };

  if (details && details.trim()) {
    payload.children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: details.trim() } }]
        }
      }
    ];
  }

  let notionRes;
  try {
    notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach Notion API', detail: err.message }), {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }

  const text = await notionRes.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: 'Unparseable Notion response', raw: text, status: notionRes.status };
  }

  // Send email notification on success
  if (data.id && RESEND_API_KEY) {
    const title    = properties?.Description?.title?.[0]?.text?.content || 'New task';
    const room     = properties?.Room?.select?.name || 'Unknown room';
    const category = properties?.Category?.select?.name || '';
    const time     = properties?.['Time Needed']?.select?.name || '';
    const supplies = properties?.['Supplies?']?.select?.name || '';
    const current  = properties?.['Current Work?']?.checkbox ? 'Yes' : 'No';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'House Projects <onboarding@resend.dev>',
        to: 'houseprojects@andrewlincolnsmith.com',
        subject: `New task: ${title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#293241;color:#DFFBFC;border-radius:10px;">
            <h2 style="margin:0 0 4px;color:#EE6B4D;font-size:1.4rem;">${title}</h2>
            <p style="margin:0 0 20px;color:#9BC0D9;font-size:0.85rem;">${room}</p>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
              <tr><td style="padding:6px 0;color:#9BC0D9;">Category</td><td style="padding:6px 0;">${category}</td></tr>
              <tr><td style="padding:6px 0;color:#9BC0D9;">Time Needed</td><td style="padding:6px 0;">${time}</td></tr>
              <tr><td style="padding:6px 0;color:#9BC0D9;">Supplies?</td><td style="padding:6px 0;">${supplies}</td></tr>
              <tr><td style="padding:6px 0;color:#9BC0D9;">Current Work?</td><td style="padding:6px 0;">${current}</td></tr>
              ${details ? `<tr><td style="padding:6px 0;color:#9BC0D9;vertical-align:top;">Details</td><td style="padding:6px 0;">${details}</td></tr>` : ''}
            </table>
          </div>
        `
      })
    }).catch(() => {}); // fire and forget — don't fail the request if email fails
  }

  return new Response(JSON.stringify(data), {
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
