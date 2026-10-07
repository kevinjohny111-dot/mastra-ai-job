import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

export const fetchJobPageTool = createTool({
  id: 'fetch-job-page',

  description: `
    Fetch a job posting webpage and return its readable text and any
    apply links. Use this only for promising job URLs. If success is
    false, skip the job or mark it unverified.
  `,

  inputSchema: z.object({
    url: z.string().url(),
  }),

  outputSchema: z.object({
    url: z.string(),
    success: z.boolean(),
    pageText: z.string(),
    applyLinks: z.array(z.string()),
    error: z.string().optional(),
  }),

  execute: async ({ url }) => {
    console.log('Fetching:', url);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timer);

      // Return errors instead of throwing so the agent can keep going
      if (!response.ok) {
        return {
          url,
          success: false,
          pageText: '',
          applyLinks: [],
          error: `HTTP ${response.status}`,
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const applyLinks: string[] = [];
      $('a[href]').each((_, el) => {
        const text = $(el).text().toLowerCase();
        const href = $(el).attr('href') || '';
        if (applyLinks.length >= 5) return;
        if (/apply/.test(text) || /apply/.test(href.toLowerCase())) {
          try {
            applyLinks.push(new URL(href, response.url).toString());
          } catch {
            /* ignore bad hrefs */
          }
        }
      });

      $('script, style, noscript, svg, nav, footer, header').remove();

      const pageText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 12000);

      if (pageText.length < 200) {
        return {
          url,
          success: false,
          pageText,
          applyLinks,
          error:
            'Page returned very little text (likely JavaScript-rendered or blocked).',
        };
      }

      return { url, success: true, pageText, applyLinks };
    } catch (err) {
      return {
        url,
        success: false,
        pageText: '',
        applyLinks: [],
        error: (err as Error).message,
      };
    }
  },
});