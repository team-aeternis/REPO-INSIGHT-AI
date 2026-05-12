import fs from "fs";
import toml from "@iarna/toml";

export const parseRustDependencies =
(filePath) => {

  const raw =
    fs.readFileSync(
      filePath,
      "utf-8"
    );

  const parsed =
    toml.parse(raw);

  const dependencies =

    Object.entries(
      parsed.dependencies || {}
    ).map(([name, version]) => ({

      name,

      version:
        typeof version === "string"
          ? version
          : JSON.stringify(version)
    }));

  return {

    ecosystem: "rust",

    dependencies,

    devDependencies: []
  };
};