import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { searchJobsTool } from '../tools/search-job';
import { fetchJobPageTool } from '../tools/fetch-job-page';

/* =========================
   Schemas
========================= */

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  experience: z.string(),
  skills: z.array(z.string()),
  description: z.string(),
  url: z.string(),
});

const searchResultSchema = z.object({
  jobs: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      experience: z.string(),
      skills: z.array(z.string()),
      description: z.string(),
      url: z.string(),
    }),
  ),
});

const fetchedJobSchema = z.object({
  url: z.string(),
  pageText: z.string(),
});

/* =========================
   STEP 1
   Search Jobs
========================= */

const searchStep = createStep({
  id: 'search-jobs',

  inputSchema: z.object({
    role: z.string(),
    location: z.string(),
    skills: z.array(z.string()),
    education: z.string(),
    experience: z.string(),
  }),

  outputSchema: searchResultSchema,

  execute: async ({ inputData }) => {
    console.log('STEP 1: Searching jobs');

    const result = await searchJobsTool.execute(inputData);

    console.log(
      `Found ${result.jobs.length} job search results`,
    );

    return result;
  },
});

/* =========================
   STEP 2
   Fetch Job Pages
========================= */

const fetchStep = createStep({
  id: 'fetch-job-pages',

  inputSchema: searchResultSchema,

  outputSchema: z.object({
    jobs: z.array(fetchedJobSchema),
  }),

  execute: async ({ inputData }) => {
    console.log('STEP 2: Fetching job pages');

    const results = await Promise.all(
      inputData.jobs.map(async (job) => {
        try {
          const result = await fetchJobPageTool.execute({
            url: job.url,
          });

          return {
            url: result.url,
            pageText: result.pageText,
          };
        } catch (error) {
          console.log(
            `Failed to fetch ${job.url}:`,
            error,
          );

          return null;
        }
      }),
    );

    const jobs = results.filter(
      (job): job is {
        url: string;
        pageText: string;
      } => job !== null,
    );

    console.log(
      `Successfully fetched ${jobs.length}/${inputData.jobs.length} pages`,
    );

    return {
      jobs,
    };
  },
});

/* =========================
   WORKFLOW
========================= */

export const jobSearchWorkflow = createWorkflow({
  id: 'job-search-workflow',

  inputSchema: z.object({
    role: z.string(),
    location: z.string(),
    skills: z.array(z.string()),
    education: z.string(),
    experience: z.string(),
  }),

  outputSchema: z.object({
    jobs: z.array(fetchedJobSchema),
  }),
})
  .then(searchStep)
  .then(fetchStep)
  .commit();