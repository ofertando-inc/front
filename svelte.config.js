import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	// precompress: the node adapter serves the generated .br/.gz assets itself,
	// so clients get compressed bundles even without a reverse proxy in front.
	kit: { adapter: adapter({ precompress: true }) }
};

export default config;
