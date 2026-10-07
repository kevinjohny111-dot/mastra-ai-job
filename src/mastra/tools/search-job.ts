import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

type SearchResult = { title: string; description: string; url: string };

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36';

// DuckDuckGo wraps links like //duckduckgo.com/l/?uddg=<encoded real url>
function decodeDdgUrl(href: string): string {
  if (!href) return '';
  const full = href.startsWith('//') ? `https:${href}` : href;
  try {
    return new URL(full).searchParams.get('uddg') ?? full;
  } catch {
    return full;
  }
}

async function searchWithTavily(query: string): Promise<SearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query, max_results: 8 }),
  });

  if (!res.ok) throw new Error(`Tavily search failed: ${res.status}`);

  const data = (await res.json()) as {
    results?: { title: string; content: string; url: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    description: (r.content ?? '').slice(0, 500),
    url: r.url,
  }));
}

async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': BROWSER_UA } },
  );

  if (!res.ok) throw new Error(`DuckDuckGo search failed: ${res.status}`);

  const $ = cheerio.load(await res.text());
  const jobs: SearchResult[] = [];

  $('.result').each((_, el) => {
    if (jobs.length >= 8) return;

    const title = $(el).find('.result__title').text().trim();
    const url = decodeDdgUrl($(el).find('.result__a').attr('href') || '');
    const description = $(el).find('.result__snippet').text().trim();

    if (!title || !url) return;
    jobs.push({ title, description: description.slice(0, 500), url });
  });

  return jobs;
}

export const searchJobsTool = createTool({
  id: 'search-jobs',

  description: `
    Search the web for current job openings.
    Returns a small list of search results (title, snippet, url).
    Use a different query/role each time you call it.
  `,

  inputSchema: z.object({
    role: z.string().describe('Job role, e.g. "Junior DevOps Engineer"'),
    location: z.string().describe('City or "Remote India"'),
    skills: z.array(z.string()).optional(),
    level: z
      .string()
      .optional()
      .describe('e.g. "fresher", "entry level", "junior". Defaults to fresher.'),
  }),

  outputSchema: z.object({
    query: z.string(),
    jobs: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
      }),
    ),
    note: z.string().optional(),
  }),

  execute: async ({ role, location, skills, level }) => {
    const skillQuery = (skills ?? []).slice(0, 2).join(' ');
    const levelQuery = level ?? 'fresher OR entry level OR junior';

    // Short, loose query: no quoted exact-phrase matching on long strings
    const query = `${role} ${location} ${levelQuery} jobs apply ${skillQuery}`
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Searching:', query);

    let jobs: SearchResult[] = [];

    try {
      jobs = process.env.TAVILY_API_KEY
        ? await searchWithTavily(query)
        : await searchWithDuckDuckGo(query);
    } catch (err) {
      console.error('Search error:', err);
      return {
        query,
        jobs: [],
        note: `Search failed: ${(err as Error).message}. Retry with a different query.`,
      };
    }

    console.log(`Found ${jobs.length} search results`);

    return {
      query,
      jobs,
      note:
        jobs.length === 0
          ? 'No results parsed. The search may have been blocked or the query too narrow. Retry with a broader or different role name.'
          : undefined,
    };
  },
});