import fs from "fs";

export const parseNodeDependencies =
(filePath) => {

  const rawData =
    fs.readFileSync(
      filePath,
      "utf-8"
    );

  const parsed =
    JSON.parse(rawData);

  return {

    ecosystem: "nodejs",

    dependencies:

      Object.entries(
        parsed.dependencies || {}
      ).map(([name, version]) => ({

        name,
        version

      })),

    devDependencies:

      Object.entries(
        parsed.devDependencies || {}
      ).map(([name, version]) => ({

        name,
        version

      }))
  };
};