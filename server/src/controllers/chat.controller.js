import { chatAgent } from "../services/agents/chatAgent.js";
import { repoAgent }
from "../services/agents/repoAgent.js";

export const askRepositoryQuestion =
async (req, res, next) => {

   try {

      const {

         repositoryId,

         question

      } = req.body;

      const response =
         await chatAgent(

            repositoryId,

            question
         );

      res.status(200).json({

         success: true,

         data: response
      });

   } catch (error) {

      next(error);
   }
};