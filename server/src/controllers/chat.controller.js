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
         await repoAgent(

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