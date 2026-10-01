import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

export const fetchJobPageTool = createTool({
  id: 'fetch-job-page',

  description: `
    Fetch a job posting webpage and return its readable text.
    Use this only for promising job URLs.
  `,

  inputSchema: z.object({
    url: z.string().url(),
  }),

  outputSchema: z.object({
    url: z.string(),
    pageText: z.string(),
  }),

  execute: async ({ url }) => {
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch job page: ${response.status}`,
      );
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    $('script, style, noscript, svg, nav, footer').remove();

    const pageText = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    return {
      url,
      pageText,
    };
  },
});