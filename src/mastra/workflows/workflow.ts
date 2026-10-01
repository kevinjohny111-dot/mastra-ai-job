import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const inputSchema = z.object({
  role: z.string(),
  location: z.string(),
  skills: z.array(z.string()),
  education: z.string(),
  experience: z.string(),
});

const searchStep = createStep({
  id: 'search-jobs',
  description: 'Search for current job openings',
  inputSchema,
  outputSchema: z.object({
    jobs: z.array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string(),
        experience: z.string(),
        skills: z.array(z.string()),
        description: z.string(),
        url: z.string(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const response = await fetch(
      `http://localhost:4111/api/agents/job-agent/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Find current jobs for:
Role: ${inputData.role}
Location: ${inputData.location}
Skills: ${inputData.skills.join(', ')}
Education: ${inputData.education}
Experience: ${inputData.experience}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Job search failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      jobs: data.jobs ?? [],
    };
  },
});

export const jobSearchWorkflow = createWorkflow({
  id: 'job-search-workflow',
  inputSchema,
  outputSchema: z.object({
    jobs: z.array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string(),
        experience: z.string(),
        skills: z.array(z.string()),
        description: z.string(),
        url: z.string(),
      })
    ),
  ),
})
  .then(searchStep)
  .commit();