import RepositoryModel
from "../../../models/Repository.model.js";

export const entryPointTool =
async (repositoryId) => {

   const repository =
      await RepositoryModel.findById(
         repositoryId
      );

   return (
      repository.entryPoints || []
   );
};