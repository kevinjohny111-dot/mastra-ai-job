import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const jobSearchQueryTool = createTool({
  id: 'job-search-query',

  description: `
    Generate targeted search queries for finding current job openings
    based on a candidate's preferred roles, skills, experience and locations.
  `,

  inputSchema: z.object({
    skills: z.array(z.string()),
    experience: z.string(),
    preferredRoles: z.array(z.string()),
    preferredLocations: z.array(z.string()),
  }),

  outputSchema: z.object({
    queries: z.array(z.string()),
  }),

  execute: async ({
    skills,
    experience,
    preferredRoles,
    preferredLocations,
  }) => {
    const queries: string[] = [];

    for (const role of preferredRoles) {
      for (const location of preferredLocations) {
        queries.push(
          `"${role}" "${location}" "${experience}" jobs`
        );
      }
    }

    // Add skill-focused searches
    for (const role of preferredRoles) {
      if (skills.length > 0) {
        queries.push(
          `"${role}" "${skills.slice(0, 3).join('" "')}" jobs`
        );
      }
    }

    return {
      queries: [...new Set(queries)],
    };
  },
});