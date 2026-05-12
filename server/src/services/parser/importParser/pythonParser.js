import fs from "fs";

export const parsePythonImports =
(file) => {

   const content =
      fs.readFileSync(
         file,
         "utf-8"
      );

   const imports = [];

   const importRegex =
      /^import\s+(.+)$/gm;

   const fromRegex =
      /^from\s+(.+)\s+import/gm;

   let match;

   while (
      (match =
         importRegex.exec(content))
      !== null
   ) {

      imports.push({

         type: "module",

         value: match[1]
      });
   }

   while (
      (match =
         fromRegex.exec(content))
      !== null
   ) {

      imports.push({

         type: "module",

         value: match[1]
      });
   }

   return {

      file,
      imports
   };
};