import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const candidateProfileTool = createTool({
  id: 'candidate-profile',

  description: `
    Extract and structure a candidate's education,
    skills, experience, preferred roles and locations.
  `,

  inputSchema: z.object({
    education: z.string(),
    skills: z.array(z.string()),
    experience: z.string(),
    preferredRoles: z.array(z.string()),
    preferredLocations: z.array(z.string()),
  }),

  outputSchema: z.object({
    profile: z.object({
      education: z.string(),
      skills: z.array(z.string()),
      experience: z.string(),
      preferredRoles: z.array(z.string()),
      preferredLocations: z.array(z.string()),
    }),
  }),

  execute: async ({
    education,
    skills,
    experience,
    preferredRoles,
    preferredLocations,
  }) => {
    return {
      profile: {
        education,
        skills,
        experience,
        preferredRoles,
        preferredLocations,
      },
    };
  },
});