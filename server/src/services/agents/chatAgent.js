import { repoAgent }
from "./repoAgent.js";

export const chatAgent =
async (

   repositoryId,

   question

) => {

   try {

      const response =
         await repoAgent(

            repositoryId,

            question
         );

      return {

         answer:
            response.answer,

         sources:
            response.sources,

         navigationHelp:
            response.navigationHelp
      };

   } catch (error) {

      console.log(
         "Chat Agent Error:",
         error
      );

      throw error;
   }
};