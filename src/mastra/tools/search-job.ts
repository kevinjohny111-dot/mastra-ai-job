import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

export const searchJobsTool = createTool({
  id: 'search-jobs',

  description: `
    Search the web for current job openings.
    Return a small number of promising job search results.
  `,

  inputSchema: z.object({
    role: z.string(),
    location: z.string(),
    skills: z.array(z.string()),
    education: z.string(),
    experience: z.string(),
  }),

  outputSchema: z.object({
    jobs: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
      }),
    ),
  }),

  execute: async ({
    role,
    location,
    skills,
    experience,
  }) => {
    const skillQuery = skills.slice(0, 3).join(' ');

    const query =
      `"${role}" "${location}" jobs ${skillQuery} "${experience}"`;

    const searchUrl =
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    console.log('Searching:', query);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Job search failed with status ${response.status}`,
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const jobs: {
      title: string;
      description: string;
      url: string;
    }[] = [];

    $('.result').each((_, element) => {
      if (jobs.length >= 5) {
        return;
      }

      const title = $(element)
        .find('.result__title')
        .text()
        .trim();

      const url =
        $(element)
          .find('.result__a')
          .attr('href') || '';

      const description = $(element)
        .find('.result__snippet')
        .text()
        .trim();

      if (!title || !url) {
        return;
      }

      jobs.push({
        title,
        description: description.slice(0, 500),
        url,
      });
    });

    console.log(`Found ${jobs.length} search results`);

    return {
      jobs,
    };
  },
});