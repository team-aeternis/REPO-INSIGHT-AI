import fs from "fs";

export const parseGoDependencies =
(filePath) => {

  const raw =
    fs.readFileSync(
      filePath,
      "utf-8"
    );

  const dependencies = [];

  const lines =
    raw.split("\n");

  lines.forEach(line => {

    const trimmed =
      line.trim();

    if (
      trimmed.startsWith("require")
    ) {

      const parts =
        trimmed
          .replace("require", "")
          .trim()
          .split(" ");

      dependencies.push({

        name: parts[0],

        version: parts[1]
      });
    }
  });

  return {

    ecosystem: "golang",

    dependencies,

    devDependencies: []
  };
};