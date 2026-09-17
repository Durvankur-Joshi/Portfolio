/**
 * contactProfile — Singleton Sanity document for the Contact room.
 *
 * Controls the email, phone, social URLs, resume link, location,
 * and availability text displayed via interactive barrels in the 3D scene.
 *
 * Singleton: Only one document of this type should exist.
 * Follows the same pattern as aboutProfile.js.
 */
export default {
  name: 'contactProfile',
  title: 'Contact Profile',
  type: 'document',
  fields: [
    // ── CONTACT DETAILS ──────────────────────────────────────────────────────
    {
      name: 'email',
      title: 'Email Address',
      type: 'string',
      description: 'Used for the MESSAGE barrel (mailto: link). e.g. joshidurvankur.29@gmail.com',
    },
    {
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Used for the PHONE barrel (tel: link). e.g. +918668382203',
    },

    // ── SOCIAL PROFILES ──────────────────────────────────────────────────────
    {
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      description: 'Full URL to your GitHub profile.',
    },
    {
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
      description: 'Full URL to your LinkedIn profile.',
    },

    // ── RESUME ───────────────────────────────────────────────────────────────
    {
      name: 'resumeUrl',
      title: 'Resume / CV URL (optional)',
      type: 'url',
      description:
        'URL to your resume PDF or hosted document. Leave empty if no resume is available yet — the Resume barrel will render but will not be clickable.',
    },

    // ── LOCATION & AVAILABILITY ──────────────────────────────────────────────
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Displayed as a small non-interactive note. e.g. Pune, India',
    },
    {
      name: 'availability',
      title: 'Available for opportunities',
      type: 'boolean',
      description: 'Toggle to show/hide the availability note in the Contact room.',
      initialValue: true,
    },
    {
      name: 'availabilityText',
      title: 'Availability Text',
      type: 'string',
      description: 'Short availability statement. e.g. Open to AI / Full-Stack opportunities',
    },
  ],

  // Singleton: prevent creating multiple contact profile documents
  __experimental_actions: ['update', 'publish', 'discardChanges'],
};
