import fs from "fs";

export const parseJSImports =
(file) => {

   const content =
      fs.readFileSync(
         file,
         "utf-8"
      );

   const imports = [];

   // ES Modules
   const importRegex =
      /import\s+.*?from\s+['"](.*?)['"]/g;

   // CommonJS
   const requireRegex =
      /require\(['"](.*?)['"]\)/g;

   let match;

   while (
      (match =
         importRegex.exec(content))
      !== null
   ) {

      imports.push({

         type:
            match[1].startsWith(".")
            ? "internal"
            : "external",

         value: match[1]
      });
   }

   while (
      (match =
         requireRegex.exec(content))
      !== null
   ) {

      imports.push({

         type:
            match[1].startsWith(".")
            ? "internal"
            : "external",

         value: match[1]
      });
   }

   return {

      file,
      imports
   };
};