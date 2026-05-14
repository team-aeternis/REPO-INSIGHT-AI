import DependencyModel
from "../../../models/Dependency.model.js";

export const dependencyTool =
async (repositoryId) => {

   const dependencies =
      await DependencyModel.find({

         repositoryId
      });

   return dependencies.map(

      dep => ({

         name:
            dep.name,

         version:
            dep.version,

         ecosystem:
            dep.ecosystem
      })
   );
};