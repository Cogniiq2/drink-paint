import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

/**
 * Cloudflare Workers build (vinext). Used only by the `*:cf` npm scripts.
 * The standard Next.js scripts (`dev`, `build`, `start`) do not read this file.
 * Do not register @vitejs/plugin-rsc here; vinext registers it automatically.
 */
export default defineConfig({
  plugins: [
    // next/image resizing + AVIF/WebP via the Cloudflare Images binding (IMAGES in wrangler.jsonc).
    // If a transform ever fails, vinext falls back to serving the original image.
    vinext({ images: { optimizer: imagesOptimizer() } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
