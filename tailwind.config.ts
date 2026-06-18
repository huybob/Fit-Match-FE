import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/modules/**/*.{ts,tsx}",
    "./src/shared/**/*.{ts,tsx}",
  ],
};

export default config;
