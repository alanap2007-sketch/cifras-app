export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL necessária' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    
    // Extrai cifra
    const cifraMatch = html.match(/<div[^>]*class="[^"]*cifra[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    let content = '';
    
    if (cifraMatch) {
      content = cifraMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\t/g, '    ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Extrai tom
    const tomMatch = html.match(/Tom:\s*<span[^>]*>([A-G][#b]?)<\/span>/i) ||
                     html.match(/Tom:\s*([A-G][#b]?)/i);
    const originalKey = tomMatch ? tomMatch[1] : 'C';

    // Extrai capotraste
    const capoMatch = html.match(/capotraste.*?(\d+).*?casa/i);
    const originalCapo = capoMatch ? parseInt(capoMatch[1]) : 0;

    // Extrai título
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extrai artista
    const artistMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
    const artist = artistMatch ? artistMatch[1].trim() : '';

    res.status(200).json({
      title,
      artist,
      content,
      original_key: originalKey,
      original_capo: originalCapo,
      original_bpm: 120
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar cifra' });
  }
}