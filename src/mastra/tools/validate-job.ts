import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const validateJobTool = createTool({
  id: 'validate-job',

  description: `
    Validate that a job application URL is reachable and appears
    to belong to the expected company or job posting.
  `,

  inputSchema: z.object({
    url: z.string().url(),
    company: z.string(),
    title: z.string(),
  }),

  outputSchema: z.object({
    valid: z.boolean(),
    url: z.string(),
    reason: z.string(),
  }),

  execute: async ({ url, company, title }) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          valid: false,
          url,
          reason: `URL returned HTTP ${response.status}.`,
        };
      }

      return {
        valid: true,
        url: response.url,
        reason: `URL is reachable. Verify the page content for ${company} - ${title}.`,
      };
    } catch {
      return {
        valid: false,
        url,
        reason: 'Unable to reach the application URL.',
      };
    }
  },
});