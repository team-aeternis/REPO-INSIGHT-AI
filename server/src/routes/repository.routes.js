import express from "express";
const router = express.Router();

import * as RepositoryController from "../controllers/repository.controller.js";

router.get("/", RepositoryController.getAllRepositories);
router.get("/resolve", RepositoryController.resolveRepositoryByUrl);
router.get("/:id", RepositoryController.getRepositoryById);
router.post("/", RepositoryController.createRepository);
router.put("/:id", RepositoryController.updateRepository);
router.delete("/:id", RepositoryController.deleteRepository);

export const repositoryRouter = router;
