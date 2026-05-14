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
            dep.packageName,

         version:
            dep.version,

         type:
            dep.type,

         ecosystem:
            dep.ecosystem
      })
   );
};
