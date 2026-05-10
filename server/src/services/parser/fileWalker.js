import fs from "fs";
import path from "path";

import { isText } from "istextorbinary";

const ignoredFolders = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
];

const ignoredFiles = [

   ".nojekyll"

];

const ignoredExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp4",
  ".mp3",
  ".zip",
  ".exe",
  ".dll",
  ".pdf",
  ".css",
];

export const walkFiles = (dirPath, fileList = []) => {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);

    const stat = fs.statSync(fullPath);

    // HANDLE DIRECTORY FIRST
    if (stat.isDirectory()) {
      // ignore folders
      if (ignoredFolders.includes(file)) {
        continue;
      }

      if (file.startsWith("google") && file.endsWith(".html")) {
        continue;
      }

      // recursive walk
      walkFiles(fullPath, fileList);

      continue;
    }

    // skip ignored extensions
    const ext = path.extname(file);

    if (ignoredExtensions.includes(ext)) {
      continue;
    }

    // skip ignored files
    if (ignoredFiles.includes(file)) {
      continue;
    }

    // skip huge files
    if (stat.size > 1024 * 1024) {
      continue;
    }

    // NOW safe to read file
    const buffer = fs.readFileSync(fullPath);

    const isTextFile = isText(fullPath, buffer);

    if (!isTextFile) {
      continue;
    }

    fileList.push(fullPath);
  }

  return fileList;
};
