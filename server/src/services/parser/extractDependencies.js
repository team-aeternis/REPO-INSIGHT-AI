import ExpressError from
"../../utils/Error.util.js";

import {
  detectProjectType
}
from "./detectProjectType.js";

import {
  parseNodeDependencies
}
from "./dependencyParser/nodeParser.js";

import {
  parsePythonDependencies
}
from "./dependencyParser/pythonParser.js";

import {
  parseGoDependencies
}
from "./dependencyParser/goParser.js";

import {
  parseRustDependencies
}
from "./dependencyParser/rustParser.js";

import {
  parseJavaDependencies
}
from "./dependencyParser/javaParser.js";

export const extractDependencies =
async (files = []) => {

  try {

    const projectType =
      detectProjectType(files);

    const {
      ecosystem,
      manifestFile
    } = projectType;

    if (!manifestFile) {

      return {

        ecosystem: "unknown",

        dependencies: [],

        devDependencies: []
      };
    }

    switch (ecosystem) {

      case "nodejs":

        return parseNodeDependencies(
          manifestFile
        );

      case "python":

        return parsePythonDependencies(
          manifestFile
        );

      case "golang":

        return parseGoDependencies(
          manifestFile
        );

      case "rust":

        return parseRustDependencies(
          manifestFile
        );

      case "java":

        return await parseJavaDependencies(
          manifestFile
        );

      default:

        return {

          ecosystem: "unknown",

          dependencies: [],

          devDependencies: []
        };
    }

  } catch (error) {

    throw new ExpressError(
      error.statusCode || 500,
      error.message
    );
  }
};