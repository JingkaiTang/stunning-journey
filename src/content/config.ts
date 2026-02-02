import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

const writing = defineCollection({
  type: 'content',
  schema: baseSchema,
});

// Now is a first-class content type
const now = defineCollection({
  type: 'content',
  schema: baseSchema,
});

export const collections = {
  writing,
  now,
};
