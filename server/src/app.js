import express from 'express';
import cookieParser from 'cookie-parser';

import { globalErrorHandler } from './middleware/errorHandler.js';

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(globalErrorHandler);

export default app;