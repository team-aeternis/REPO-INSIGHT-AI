import FileModel from "../../models/File.model.js";

export const extractModules = async (repositoryId) => {
  try {
    const files = await FileModel.find({
      repositoryId,
    });

    const modulePatterns = {
      Authentication: ["auth", "jwt", "login", "signup", "token", "session"],

      Database: ["db", "database", "mongoose", "sequelize", "prisma", "model"],

      Analysis: ["analysis", "detect", "scanner", "optimization", "report"],

      API: ["route", "controller", "middleware", "api"],

      Frontend: ["component", "page", "redux", "store", "ui"],
    };

    const modules = {};

    // initialize

    Object.keys(modulePatterns).forEach((moduleName) => {
      modules[moduleName] = [];
    });

    // file classification

    for (const file of files) {
      const searchableText = `

${file.fileName}
${file.filePath}
${file.category}
${file.imports?.join(" ")}
`.toLowerCase();

      for (const [moduleName, keywords] of Object.entries(modulePatterns)) {
        const score = keywords.filter((keyword) =>
          searchableText.includes(keyword),
        ).length;
        if (score >= 2) {
          modules[moduleName].push({
            fileName: file.fileName,

            filePath: file.filePath,

            score,
          });
        }
      }
    }

    // remove empty modules

    const cleanedModules = {};

    for (const [moduleName, moduleFiles] of Object.entries(modules)) {
      if (moduleFiles.length > 0) {
        cleanedModules[moduleName] = moduleFiles;
      }
    }

    return cleanedModules;
  } catch (error) {
    console.log("Module Extraction Error:", error);

    throw error;
  }
};
