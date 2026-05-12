import fs from "fs";
import xml2js from "xml2js";

export const parseJavaDependencies =
async (filePath) => {

  const raw =
    fs.readFileSync(
      filePath,
      "utf-8"
    );

  const parsed =
    await xml2js.parseStringPromise(
      raw
    );

  const dependencyList =

    parsed.project
      ?.dependencies?.[0]
      ?.dependency || [];

  const dependencies =

    dependencyList.map(dep => ({

      name:
        dep.artifactId?.[0],

      version:
        dep.version?.[0] ||
        "unknown"
    }));

  return {

    ecosystem: "java",

    dependencies,

    devDependencies: []
  };
};