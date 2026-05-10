import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const git = simpleGit();

export const cloneRepo = async (githubUrl, transaction) => {

  try{
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
  await git.clone(githubUrl, repoPath);

  return {
    workspaceId,
    repoPath,
  };
  }catch (error) {
    throw error;
  }
};
