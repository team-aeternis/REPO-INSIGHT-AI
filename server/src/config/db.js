import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {

   try {

      const connection =
         await mongoose.connect(
            env.MONGODB_URL,
            env.DB_NAME ? { dbName: env.DB_NAME } : undefined,
         );

      console.log(
         "Database connected successfully!"
      );

   } catch (error) {

      console.log(error);

      process.exit(1);
   }
};
