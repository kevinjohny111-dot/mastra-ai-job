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

export const rankJobsTool = createTool({
  id: 'rank-jobs',

  description: `
    Rank job opportunities by relevance to the candidate.
    Higher match scores should appear first.
  `,

  inputSchema: z.object({
    jobs: z.array(
      jobSchema.extend({
        matchScore: z.number(),
        matchingSkills: z.array(z.string()),
        missingSkills: z.array(z.string()),
        explanation: z.string(),
      }),
    ),
  }),

  outputSchema: z.object({
    rankedJobs: z.array(
      jobSchema.extend({
        matchScore: z.number(),
        matchingSkills: z.array(z.string()),
        missingSkills: z.array(z.string()),
        explanation: z.string(),
      }),
    ),
  }),

  execute: async ({ jobs }) => {
    const rankedJobs = [...jobs]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return {
      rankedJobs,
    };
  },
});