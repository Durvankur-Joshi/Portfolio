/**
 * aboutProfile — Singleton Sanity document for the About room content.
 *
 * Manages the text content displayed in the 3D sky/flight story milestones.
 * Separate from globalInfo (which handles site-wide SEO + social URLs).
 *
 * Singleton: Only one document of this type should exist.
 */
export default {
  name: 'aboutProfile',
  title: 'About Profile',
  type: 'document',
  fields: [
    // ── PROFILE ──────────────────────────────────────────────────────────────
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      description: 'Displayed in the Intro milestone (e.g. DURVANKUR JOSHI)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Short descriptor below name (e.g. Computer Engineering Student • AI & Full-Stack Developer)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'bio',
      title: 'Bio (SEO / Accessibility)',
      type: 'text',
      description: 'Short bio — used in the accessibility layer (screen readers / SEO). Not displayed in 3D.',
    },

    // ── EDUCATION ────────────────────────────────────────────────────────────
    {
      name: 'education',
      title: 'Education',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'institution',
              title: 'Institution',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'degree',
              title: 'Degree / Program',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'score',
              title: 'Score (CGPA / Percentage)',
              type: 'string',
            },
            {
              name: 'period',
              title: 'Period (e.g. 2022–2025)',
              type: 'string',
            },
          ],
          preview: {
            select: { title: 'institution', subtitle: 'degree' },
          },
        },
      ],
    },

    // ── HIGHLIGHTS (Journey / Projects shown in story) ────────────────────
    {
      name: 'highlights',
      title: 'Journey Highlights',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
            },
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Project', value: 'project' },
                  { title: 'Open Source', value: 'opensource' },
                  { title: 'Achievement', value: 'achievement' },
                  { title: 'Focus Area', value: 'focus' },
                ],
                layout: 'radio',
              },
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'type' },
          },
        },
      ],
    },

    // ── OPEN SOURCE ───────────────────────────────────────────────────────────
    {
      name: 'openSource',
      title: 'Open Source Contributions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Project Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
            },
            {
              name: 'features',
              title: 'Features / Key Points',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Short feature labels shown in the milestone',
            },
            {
              name: 'url',
              title: 'URL (optional)',
              type: 'url',
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'description' },
          },
        },
      ],
    },

    // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
    {
      name: 'achievements',
      title: 'Achievements / Hackathons',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Achievement Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description (e.g. 1st Place)',
              type: 'string',
            },
            {
              name: 'url',
              title: 'URL (optional)',
              type: 'url',
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'description' },
          },
        },
      ],
    },
  ],

  // Singleton: prevent creating multiple documents
  __experimental_actions: ['update', 'publish', 'discardChanges'],
};
