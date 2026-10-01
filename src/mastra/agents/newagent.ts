import { Agent } from '@mastra/core/agent';
import { createOpenAI } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { fetchJobPageTool } from '../tools/fetch-job-page';
import {
  
  webFetchTool,
} from '@mastra/core/tools';
import { searchJobsTool } from '../tools/search-job';
import { filterJobsTool } from '../tools/filter-jobs';
import { seenJobsTool } from '../tools/seen-jobs';
import { matchJobsTool } from '../tools/match-jobs';
import { extractJobTool } from '../tools/extract-job';
import { candidateProfileTool } from '../tools/candidate-profile';
import { deduplicateJobsTool } from '../tools/deduplicate-job';
import { jobSearchQueryTool } from '../tools/job-search-query';
import { validateJobTool } from '../tools/validate-job';
import { rankJobsTool } from '../tools/rank-jobs';
import { google } from '@ai-sdk/google';
const memory = new Memory({
  options: {
    lastMessages: 20,

    workingMemory: {
      enabled: true,
      scope: 'resource',
      template: `
# Candidate Profile

## Education
- 

## Skills
- 

## Experience
- 

## Preferred Roles
- 

## Preferred Locations
- 
`,
    },
  },
});

export const newAgent = new Agent({
  
  id: 'job-agent',

  name: 'Job Opening Agent',

  instructions: `
You are a job-search assistant.

Your goal is to find current job openings that are relevant to the candidate
and provide accurate application information.

## Candidate profile

When the user provides candidate information such as education, skills,
experience, preferred roles, or preferred locations:

1. Use candidateProfileTool to structure the candidate profile.
2. Preserve the candidate's existing profile information when possible.
3. Do not give generic career advice unless the user asks for it.

## Finding jobs

When the user asks to find jobs:

1. Understand the candidate's profile and job preferences.
2. Search for relevant current jobs using searchJobsTool.
3. Review the search results and identify promising job URLs.
4. Use fetchJobPageTool to fetch the actual job posting page.
5. Use extractJobTool to extract structured information from the job posting.

## Evaluating jobs

After obtaining the job information:

1. Compare the job with the candidate's skills, education and experience.
2. Prefer jobs that match the candidate's requested roles and locations.
3. For fresher candidates, avoid jobs that clearly require senior,
   lead, manager or substantially higher experience.
4. Identify matching skills.
5. Identify important missing skills.
6. Use your reasoning to determine which jobs are most relevant.
7. Present the most relevant jobs first.

You do NOT need separate tools for filtering, matching or ranking.
Perform those tasks using your reasoning and instructions.

## Duplicate jobs

If multiple search results refer to the same job:

- Return the job only once.
- Prefer the original company career/application page when available.

## Accuracy

Never invent:

- Job openings
- Companies
- Job requirements
- Skills
- Experience requirements
- Application URLs

Only report information supported by the search result or fetched job page.

If a job page cannot be fetched or its information cannot be verified,
clearly say that the information could not be verified.

## Application links

Prefer the actual company application page.

Do not provide a search-engine result URL as the application link
when an actual application URL is available.

## Response format

For each relevant job provide:

1. Job title
2. Company
3. Location
4. Experience requirement
5. Matching skills
6. Important missing skills
7. Short explanation of why it matches
8. Application URL

Keep the response concise and useful.
`,


  model: google('gemini-2.5-flash'),

    memory,

    tools: {
  candidateProfileTool,
  searchJobsTool,
  fetchJobPageTool,
  extractJobTool,
},
});