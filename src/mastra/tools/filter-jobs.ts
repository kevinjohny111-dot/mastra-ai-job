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

export const filterJobsTool = createTool({
  id: 'filter-jobs',

  description: `
    Filter job openings based on candidate experience,
    preferred roles and preferred locations.
    Remove jobs that are clearly unsuitable.
  `,

  inputSchema: z.object({
    candidate: z.object({
      experience: z.string(),
      preferredRoles: z.array(z.string()),
      preferredLocations: z.array(z.string()),
    }),

    jobs: z.array(jobSchema),
  }),

  outputSchema: z.object({
    jobs: z.array(jobSchema),
  }),

  execute: async ({ candidate, jobs }) => {
    const isFresher =
      candidate.experience.toLowerCase().includes('fresher') ||
      candidate.experience.toLowerCase().includes('0 years');

    const filteredJobs = jobs.filter((job) => {
      const text = `
        ${job.title}
        ${job.experience}
        ${job.description}
      `.toLowerCase();

      // Remove obvious senior jobs for freshers
      if (
        isFresher &&
        (
          text.includes('senior') ||
          text.includes('lead') ||
          text.includes('manager') ||
          text.includes('5+ years') ||
          text.includes('6+ years') ||
          text.includes('7+ years') ||
          text.includes('8+ years')
        )
      ) {
        return false;
      }

      return true;
    });

    return {
      jobs: filteredJobs,
    };
  },
});