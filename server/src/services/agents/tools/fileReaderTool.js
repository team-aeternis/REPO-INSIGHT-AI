import fs from "fs/promises";

export const fileReaderTool =
async (filePath) => {

   try {

      const content =
         await fs.readFile(

            filePath,
            "utf-8"
         );

      return content;

   } catch (error) {

      return null;
   }
};