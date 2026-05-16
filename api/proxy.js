export default async function handler(req, res) {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const response = await fetch(url);
    const data = await response.text();
    
    // Forward the headers and status
    res.status(response.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}