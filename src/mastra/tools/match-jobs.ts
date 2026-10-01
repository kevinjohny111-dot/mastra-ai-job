import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const skillAliases: Record<string, string> = {
  aws: 'aws',
  'amazon web services': 'aws',

  postgres: 'postgresql',
  postgresql: 'postgresql',

  js: 'javascript',
  javascript: 'javascript',

  ts: 'typescript',
  typescript: 'typescript',

  reactjs: 'react',
  'react.js': 'react',
  react: 'react',

  node: 'node.js',
  'node.js': 'node.js',

  k8s: 'kubernetes',
  kubernetes: 'kubernetes',

  'ci/cd': 'cicd',
  'continuous integration': 'cicd',
  'continuous deployment': 'cicd',

  docker: 'docker',
  git: 'git',
  github: 'github',
  linux: 'linux',
  terraform: 'terraform',
  python: 'python',
  java: 'java',
  sql: 'sql',
  fastapi: 'fastapi',
};

function normalizeSkill(skill: string): string {
  const normalized = skill
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  return skillAliases[normalized] ?? normalized;
}

function getRequiredYears(experience: string): number | null {
  const text = experience.toLowerCase();

  // Examples:
  // "0-1 years"
  // "1-2 years"
  // "3+ years"
  // "minimum 2 years"

  const plusMatch = text.match(/(\d+)\s*\+/);

  if (plusMatch) {
    return Number(plusMatch[1]);
  }

  const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);

  if (rangeMatch) {
    return Number(rangeMatch[1]);
  }

  const minimumMatch = text.match(
    /(?:minimum|min|at least)\s*(\d+)\s*years?/,
  );

  if (minimumMatch) {
    return Number(minimumMatch[1]);
  }

  const singleMatch = text.match(/(\d+)\s*years?/);

  if (singleMatch) {
    return Number(singleMatch[1]);
  }

  return null;
}

function getCandidateYears(experience: string): number {
  const text = experience.toLowerCase();

  if (
    text.includes('fresher') ||
    text.includes('fresh graduate') ||
    text.includes('0 years')
  ) {
    return 0;
  }

  return getRequiredYears(text) ?? 0;
}

export const matchJobsTool = createTool({
  id: 'match-jobs',

  description: `
    Compare job openings against a candidate profile.
    Calculate a match score using skills, experience,
    location and education. Normalize common skill names
    such as AWS/Amazon Web Services and PostgreSQL/Postgres.
  `,

  inputSchema: z.object({
    candidate: z.object({
      education: z.string(),
      skills: z.array(z.string()),
      experience: z.string(),
      location: z.string(),
    }),

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
  }),

  outputSchema: z.object({
    matches: z.array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string(),
        matchScore: z.number(),
        matchingSkills: z.array(z.string()),
        missingSkills: z.array(z.string()),
        explanation: z.string(),
        url: z.string(),
      }),
    ),
  }),

  execute: async ({ candidate, jobs }) => {
    const candidateSkills = candidate.skills.map(normalizeSkill);
    const candidateYears = getCandidateYears(
      candidate.experience,
    );

    const matches = jobs.map((job) => {
      const jobSkills = job.skills.map(normalizeSkill);

      const matchingSkills = job.skills.filter((skill) =>
        candidateSkills.includes(normalizeSkill(skill)),
      );

      const missingSkills = job.skills.filter(
        (skill) =>
          !candidateSkills.includes(normalizeSkill(skill)),
      );

      /*
       * 50 points — Skills
       */
      const skillScore =
        jobSkills.length > 0
          ? (matchingSkills.length / jobSkills.length) * 50
          : 0;

      /*
       * 20 points — Experience
       */
      const requiredYears = getRequiredYears(
        job.experience,
      );

      let experienceScore = 20;

      if (
        requiredYears !== null &&
        candidateYears < requiredYears
      ) {
        experienceScore = 0;
      }

      /*
       * 15 points — Location
       */
      const jobLocation = job.location.toLowerCase();
      const candidateLocation =
        candidate.location.toLowerCase();

      const locationMatch =
        jobLocation.includes(candidateLocation) ||
        candidateLocation.includes(jobLocation);

      const locationScore = locationMatch ? 15 : 0;

      /*
       * 15 points — Education
       */
      const education = candidate.education.toLowerCase();

      const educationMatch =
        education.includes('computer') ||
        education.includes('software') ||
        education.includes('information technology') ||
        education.includes('engineering');

      const educationScore = educationMatch ? 15 : 0;

      const matchScore = Math.round(
        Math.min(
          skillScore +
            experienceScore +
            locationScore +
            educationScore,
          100,
        ),
      );

      return {
        title: job.title,
        company: job.company,
        location: job.location,
        matchScore,
        matchingSkills,
        missingSkills,

        explanation:
          `${matchingSkills.length} of ${job.skills.length} listed skills match. ` +
          `Experience requirement: ${job.experience}. ` +
          `Location match: ${locationMatch ? 'Yes' : 'No'}. ` +
          `Education match: ${educationMatch ? 'Yes' : 'No'}.`,

        url: job.url,
      };
    });

    matches.sort(
      (a, b) => b.matchScore - a.matchScore,
    );

    return {
      matches,
    };
  },
});