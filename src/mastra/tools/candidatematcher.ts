import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import path from 'path';

const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  education: z.string(),
  skills: z.array(z.string()),
  experience: z.string(),
});

export const candidateMatcherTool = createTool({
  id: 'candidate-matcher',

  description: `
    Load the candidate database and provide candidate information
    for matching against a job description.
    The agent should analyze, compare and rank the candidates.
  `,

  inputSchema: z.object({
    jobDescription: z.string(),
  }),

  outputSchema: z.object({
    jobDescription: z.string(),
    candidates: z.array(candidateSchema),
  }),

  execute: async ({ jobDescription }) => {
    console.log('🚀 CANDIDATE MATCHER TOOL CALLED');

    const filePath = path.join(process.cwd(), 'candidates.json');

    console.log('📁 Looking for:', filePath);

    const file = await readFile(filePath, 'utf-8');

    console.log('📄 candidates.json found');

    const candidates = JSON.parse(file);

    console.log(`👥 Loaded ${candidates.length} candidates`);

    const validatedCandidates = z.array(candidateSchema).parse(candidates);

    return {
      jobDescription,
      candidates: validatedCandidates,
    };
  },
});