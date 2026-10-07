import * as cheerio from 'cheerio';

async function main() {
  const q = 'Junior DevOps Engineer Bengaluru fresher jobs';

  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      },
    },
  );

  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('status:', res.status);
  console.log('results found:', $('.result').length);
  console.log('first 500 chars:', html.slice(0, 500));
}

main().catch(console.error);