import express from "express";
const router = express.Router();

import * as RepositoryController from "../controllers/Repository.controller.js";

router.get("/", RepositoryController.getAllRepositories);
router.get("/:id", RepositoryController.getRepositoryById);
router.post("/", RepositoryController.createRepository);
router.put("/:id", RepositoryController.updateRepository);
router.delete("/:id", RepositoryController.deleteRepository);

export const repositoryRouter = router;