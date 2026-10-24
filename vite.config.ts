import fs from 'node:fs';
import { defineConfig } from 'vite';

// Windows sandbox compatibility: realpathSync.native throws EPERM in some environments
if (fs.realpathSync && fs.realpathSync.native) {
  fs.realpathSync.native = fs.realpathSync;
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cpu_scheduler_sim/',
});
