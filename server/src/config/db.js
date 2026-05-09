import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {

   try {

      const connection =
         await mongoose.connect(
            env.MONGODB_URL
         );

      console.log(
         "Database connected successfully!"
      );

   } catch (error) {

      console.log(error);

      process.exit(1);
   }
};