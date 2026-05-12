import fs from "fs";

export const parsePythonDependencies =
(filePath) => {

  const raw =
    fs.readFileSync(
      filePath,
      "utf-8"
    );

  const lines =
    raw.split("\n");

  const dependencies =
    lines
      .filter(line => line.trim())
      .map(line => {

        const [name, version] =
          line.split("==");

        return {

          name:
            name?.trim(),

          version:
            version?.trim() ||
            "unknown"
        };
      });

  return {

    ecosystem: "python",

    dependencies,

    devDependencies: []
  };
};