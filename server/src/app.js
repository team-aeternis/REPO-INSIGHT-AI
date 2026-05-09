import express from 'express';
import cookieParser from 'cookie-parser';

import { globalErrorHandler } from './middleware/errorHandler.js';

// Routes -

import {chatRouter } from "./routes/chat.routes.js";
import { repositoryRouter } from "./routes/repository.routes.js";

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/chat", chatRouter);
app.use("/api/repo", repositoryRouter);


app.use(globalErrorHandler);

export default app;