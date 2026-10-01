import { matchJobsTool } from './src/mastra/tools/match-jobs';

const candidate = {
  education: 'B.Tech Computer Science',
  skills: [
    'Python',
    'AWS',
    'Docker',
    'Linux',
    'Git',
    'PostgreSQL',
    'FastAPI',
  ],
  experience: 'Fresher',
  location: 'Bangalore',
};

const jobs = [
  {
    title: 'Junior Cloud Engineer',
    company: 'Example Technologies',
    location: 'Bangalore',
    experience: '0-1 years',
    skills: [
      'Python',
      'AWS',
      'Docker',
      'Linux',
      'Terraform',
    ],
    description: 'Entry-level cloud engineering position.',
    url: 'https://example.com/job/1',
  },

  {
    title: 'Frontend Developer',
    company: 'Example Software',
    location: 'Hyderabad',
    experience: '2-3 years',
    skills: [
      'React',
      'JavaScript',
      'TypeScript',
    ],
    description: 'Frontend development position.',
    url: 'https://example.com/job/2',
  },
];

async function main() {
  const result = await matchJobsTool.execute({
    candidate,
    jobs,
  });

  console.log(JSON.stringify(result, null, 2));
}

main();