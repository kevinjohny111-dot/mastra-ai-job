import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  experience: z.string(),
  skills: z.array(z.string()),
  description: z.string(),
  url: z.string(),
});

const dataDirectory = path.resolve(
  process.cwd(),
  'data',
);

const seenJobsFile = path.join(
  dataDirectory,
  'seen-jobs.json',
);

async function loadSeenJobs() {
  try {
    const data = await fs.readFile(
      seenJobsFile,
      'utf-8',
    );

    return JSON.parse(data) as Record<
      string,
      {
        title: string;
        company: string;
        location: string;
        firstSeen: string;
        lastSeen: string;
      }
    >;
  } catch {
    return {};
  }
}

async function saveSeenJobs(
  jobs: Record<
    string,
    {
      title: string;
      company: string;
      location: string;
      firstSeen: string;
      lastSeen: string;
    }
  >,
) {
  await fs.mkdir(dataDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    seenJobsFile,
    JSON.stringify(jobs, null, 2),
    'utf-8',
  );
}

export const seenJobsTool = createTool({
  id: 'seen-jobs',

  description: `
    Check whether jobs have already been seen by the candidate.
    New jobs are recorded so they can be excluded from future searches.
  `,

  inputSchema: z.object({
    jobs: z.array(jobSchema),
  }),

  outputSchema: z.object({
    newJobs: z.array(jobSchema),
    previouslySeenJobs: z.array(jobSchema),
  }),

  execute: async ({ jobs }) => {
    const seenJobs = await loadSeenJobs();

    const newJobs = [];
    const previouslySeenJobs = [];

    const now = new Date().toISOString();

    for (const job of jobs) {
      const key = job.url
        .toLowerCase()
        .trim()
        .replace(/\/$/, '');

      if (seenJobs[key]) {
        previouslySeenJobs.push(job);

        seenJobs[key].lastSeen = now;
      } else {
        newJobs.push(job);

        seenJobs[key] = {
          title: job.title,
          company: job.company,
          location: job.location,
          firstSeen: now,
          lastSeen: now,
        };
      }
    }

    await saveSeenJobs(seenJobs);

    return {
      newJobs,
      previouslySeenJobs,
    };
  },
});