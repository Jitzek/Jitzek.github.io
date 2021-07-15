import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		vite: {
			resolve: {
				alias: {
					$components: path.resolve('src', 'components'),
					$stores: path.resolve('src', 'stores')
				}
			}
		},

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null
		}),

		paths: {
			base: '',
			assets: ''
		}
	},
};

export default config;