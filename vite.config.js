import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mockApi } from "./mock-server/mockApi.js";

// mockApi() adds the BasketNow REST API (mock-server/mockApi.js) to the dev server:
// one command, `npm run dev`, serves the React app AND http://localhost:5173/api/...
export default defineConfig({
  plugins: [react(), mockApi()],
  server: { port: 5173, open: true },
});
