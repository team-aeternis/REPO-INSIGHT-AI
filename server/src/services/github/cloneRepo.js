import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execSync } from "child_process";
import ExpressError from "../../utils/Error.util.js";

const git = simpleGit();

export const cloneRepo = async (githubUrl) => {

  try{
    try {
      execSync("git --version", { stdio: "ignore" });
    } catch {
      throw new ExpressError(
        500,
        "Git is not installed on the server runtime. Install git in deployment environment.",
      );
    }

    // unique workspace id
  const workspaceId = crypto.randomUUID();

  // local repo path
  const repoPath = path.join(
    process.cwd(),

    "temp",
    "repositories",

    workspaceId,
  );

  // create directory
  fs.mkdirSync(repoPath, {
    recursive: true,
  });

  // clone repo
  await git.clone(githubUrl, repoPath, ["--depth", "1"]);

  return {
    workspaceId,
    repoPath,
  };
  }catch (error) {
    throw error;
  }
};
