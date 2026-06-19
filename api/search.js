export default async function handler(req, res) {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query necessária' });
  }

  try {
    // Busca no Cifra Club
    const response = await fetch(
      `https://www.cifraclub.com.br/busca/?q=${encodeURIComponent(q)}&tipo=cifra`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    const html = await response.text();
    
    // Extrai resultados
    const results = [];
    const regex = /<a[^>]*href="(https:\/\/www\.cifraclub\.com\.br\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const url = match[1];
      const title = match[2].trim();
      
      // Filtra apenas músicas (URLs com 2+ níveis)
      const urlParts = url.replace('https://www.cifraclub.com.br/', '').split('/').filter(p => p);
      
      if (urlParts.length >= 2 && title && title.length > 3) {
        // Extrai artista e título da URL
        const artist = urlParts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const songTitle = urlParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (!results.find(r => r.url === url)) {
          results.push({
            title: songTitle,
            artist: artist,
            url: url,
            site: 'Cifra Club'
          });
        }
      }
    }

    res.status(200).json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar' });
  }
}