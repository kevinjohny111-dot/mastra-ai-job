import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  experience: z.string(),
  skills: z.array(z.string()),
  description: z.string(),
  url: z.string(),
});

export const deduplicateJobsTool = createTool({
  id: 'deduplicate-jobs',

  description: `
    Remove duplicate job postings from a list of jobs.
    Use the application URL as the primary identifier.
    If URLs differ, compare company, title and location.
  `,

  inputSchema: z.object({
    jobs: z.array(jobSchema),
  }),

  outputSchema: z.object({
    jobs: z.array(jobSchema),
  }),

  execute: async ({ jobs }) => {
    const seen = new Set<string>();
    const uniqueJobs = [];

    for (const job of jobs) {
      const normalizedUrl = job.url
        .toLowerCase()
        .trim()
        .replace(/\/$/, '');

      const fallbackKey = [
        job.company,
        job.title,
        job.location,
      ]
        .join('|')
        .toLowerCase()
        .trim();

      const key = normalizedUrl || fallbackKey;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    return {
      jobs: uniqueJobs,
    };
  },
});