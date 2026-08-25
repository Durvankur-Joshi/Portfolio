/**
 * Technology to Logo Mapping Utility
 * Maps technology names from Sanity CMS or data arrays to existing 3D texture assets.
 */

export const TECH_TO_LOGO_MAP = {
    // Frontend
    'react': '/textures/gallery/reactlogo.webp',
    'react.js': '/textures/gallery/reactlogo.webp',
    'next.js': '/textures/gallery/reactlogo.webp',
    'nextjs': '/textures/gallery/reactlogo.webp',
    'three.js': '/textures/gallery/reactlogo.webp',
    'react three fiber': '/textures/gallery/reactlogo.webp',
    'javascript': '/textures/gallery/jslogo.webp',
    'js': '/textures/gallery/jslogo.webp',
    'typescript': '/textures/gallery/jslogo.webp',
    'ts': '/textures/gallery/jslogo.webp',
    'node.js': '/textures/gallery/jslogo.webp',
    'nodejs': '/textures/gallery/jslogo.webp',
    'express.js': '/textures/gallery/jslogo.webp',
    'websockets': '/textures/gallery/jslogo.webp',
    'socket.io': '/textures/gallery/jslogo.webp',
    'html': '/textures/gallery/htmllogo.webp',
    'html5': '/textures/gallery/htmllogo.webp',
    'gemini': '/textures/gallery/htmllogo.webp',
    'llm': '/textures/gallery/htmllogo.webp',
    'generative ai': '/textures/gallery/htmllogo.webp',
    'css': '/textures/gallery/csslogo.webp',
    'css3': '/textures/gallery/csslogo.webp',
    'solidity': '/textures/gallery/csslogo.webp',
    'smart contracts': '/textures/gallery/csslogo.webp',
    'langchain': '/textures/gallery/csslogo.webp',
    'langgraph': '/textures/gallery/csslogo.webp',
    'hugging face': '/textures/gallery/csslogo.webp',
    'vector database': '/textures/gallery/csslogo.webp',
    'tailwind css': '/textures/gallery/tailwindlogo.webp',
    'tailwind': '/textures/gallery/tailwindlogo.webp',
    'fastapi': '/textures/gallery/tailwindlogo.webp',
    'python': '/textures/gallery/tailwindlogo.webp',
    'postgresql': '/textures/gallery/tailwindlogo.webp',
    'mongodb': '/textures/gallery/tailwindlogo.webp',
    'supabase': '/textures/gallery/tailwindlogo.webp',
    'redis': '/textures/gallery/tailwindlogo.webp',
    'pytorch': '/textures/gallery/tailwindlogo.webp',
    'tensorflow': '/textures/gallery/tailwindlogo.webp',
    'opencv': '/textures/gallery/tailwindlogo.webp',
    'firebase': '/textures/gallery/firebaselogo.webp',
    'cloudinary': '/textures/gallery/firebaselogo.webp',
    'aws': '/textures/gallery/firebaselogo.webp',
    'docker': '/textures/gallery/firebaselogo.webp',
    'ipfs': '/textures/gallery/firebaselogo.webp',
    'github actions': '/textures/gallery/firebaselogo.webp',
    'netlify': '/textures/gallery/netlifylogo.webp',
    'vercel': '/textures/gallery/netlifylogo.webp',
    'render': '/textures/gallery/netlifylogo.webp',
    'web3': '/textures/gallery/netlifylogo.webp',
    'web3.js': '/textures/gallery/netlifylogo.webp',
    'ethers.js': '/textures/gallery/netlifylogo.webp',
    'ethereum': '/textures/gallery/netlifylogo.webp',
    'php': '/textures/gallery/phplogo.webp',
    'wordpress': '/textures/gallery/wordpresslogo.webp',
    'elementor': '/textures/gallery/elementorlogo.webp',
};

/**
 * Resolves a technology name or filename to a valid local logo texture path
 * @param {string} tech - Tech name or filename (e.g., 'React', 'FastAPI', 'reactlogo.webp')
 * @returns {string} Absolute path to webp logo
 */
export function mapTechToLogo(tech) {
    if (!tech) return '/textures/gallery/jslogo.webp';
    if (tech.startsWith('/textures/gallery/')) return tech;
    if (tech.endsWith('.webp')) return `/textures/gallery/${tech}`;
    const clean = tech.toLowerCase().trim();
    return TECH_TO_LOGO_MAP[clean] || '/textures/gallery/reactlogo.webp';
}
