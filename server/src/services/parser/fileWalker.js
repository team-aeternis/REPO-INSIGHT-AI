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
  "vendor",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".cache",
  ".turbo",
  ".yarn",
  ".idea",
  ".vscode",
  "bower_components",
  "Pods",
];

const ignoredFiles = [

  ".nojekyll",
  ".DS_Store",
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
  ".map",
  ".lock",
];

export const walkFiles = (dirPath, fileList = []) => {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of files) {
    const file = entry.name;
    const fullPath = path.join(dirPath, file);

    // HANDLE DIRECTORY FIRST
    if (entry.isDirectory()) {
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

    // Do not follow symlinks or sockets in untrusted repository trees.
    if (!entry.isFile()) continue;

    const stat = fs.statSync(fullPath);

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
    if (stat.size > 2 * 1024 * 1024) {
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
