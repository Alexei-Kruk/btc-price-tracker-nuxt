export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: ["@nuxt/eslint", "@nuxt/fonts"],
	runtimeConfig: {
		DATABASE_URL: process.env.DATABASE_URL,
	},
	build: {
		transpile: ["apexcharts", "vue3-apexcharts"],
	},
	vite: {
		optimizeDeps: {
			include: ["apexcharts"],
		},
	},
	plugins: ["~/plugins/apexcharts.client.ts"],
	ssr: false,
	css: ["@/assets/scss/main.scss"],
	components: {
		global: true,
		dirs: ["~/components"],
	},
	nitro: {
		prerender: {
			crawlLinks: false,
		},
	},
	app: {
		head: {
		titleTemplate: 'Bitcoin Price Tracker'
		}
	}
});
