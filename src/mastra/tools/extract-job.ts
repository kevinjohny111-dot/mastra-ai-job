import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const extractJobTool = createTool({
  id: 'extract-job',

  description: `
    Extract structured job information from the text of a job posting.
    Identify the job title, company, location, experience requirement,
    required skills, description and application URL.
  `,

  inputSchema: z.object({
    pageText: z.string(),
    url: z.string(),
  }),

  outputSchema: z.object({
    job: z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      experience: z.string(),
      skills: z.array(z.string()),
      description: z.string(),
      url: z.string(),
    }),
  }),

  execute: async ({ pageText, url }) => {
    // The LLM/agent will perform the actual extraction.
    // This tool provides the structured schema.
    
    return {
      job: {
        title: '',
        company: '',
        location: '',
        experience: '',
        skills: [],
        description: pageText,
        url,
      },
    };
  },
});