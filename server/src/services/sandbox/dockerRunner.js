import { exec } from "child_process";
import path from "path";

const run = (command, options = {}) =>
  new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });

export const runTestsInDocker = async (repoPath) => {
  const normalizedPath = path.resolve(repoPath);
  const image = "node:22-alpine";
  const command = `docker run --rm -v "${normalizedPath}:/workspace" -w /workspace ${image} sh -lc "npm test --if-present"`;
  return run(command, { timeout: 120000 });
};
