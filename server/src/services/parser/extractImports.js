import ExpressError from
"../../utils/Error.util.js";

import {
  detectProjectType
} from "./detectProjectType.js";

import {
  parseJSImports
} from "./importParser/jsParser.js";

import {
  parsePythonImports
} from "./importParser/pythonParser.js";

import {
  parseJavaImports
} from "./importParser/javaParser.js";

import {
  parseGoImports
} from "./importParser/goParser.js";

import {
  parseRustImports
} from "./importParser/rustParser.js";

export const extractImports =
(files = []) => {

  try {

    const projectType =
      detectProjectType(files);

    const ecosystem =
      projectType.ecosystem;

    let parsedImports = [];

    switch (ecosystem) {

      case "nodejs":

        parsedImports = files
          .filter(file =>

            file.endsWith(".js") ||

            file.endsWith(".jsx") ||

            file.endsWith(".ts") ||

            file.endsWith(".tsx")
          )
          .map(file =>

            parseJSImports(file)
          );

        break;

      case "python":

        parsedImports = files
          .filter(file =>

            file.endsWith(".py")
          )
          .map(file =>

            parsePythonImports(file)
          );

        break;

      case "java":

        parsedImports = files
          .filter(file =>

            file.endsWith(".java")
          )
          .map(file =>

            parseJavaImports(file)
          );

        break;

      case "golang":

        parsedImports = files
          .filter(file =>

            file.endsWith(".go")
          )
          .map(file =>

            parseGoImports(file)
          );

        break;

      case "rust":

        parsedImports = files
          .filter(file =>

            file.endsWith(".rs")
          )
          .map(file =>

            parseRustImports(file)
          );

        break;

      default:

        parsedImports = [];
    }

    return parsedImports;

  } catch (error) {

    throw new ExpressError(

      error.statusCode || 500,

      error.message
    );
  }
};