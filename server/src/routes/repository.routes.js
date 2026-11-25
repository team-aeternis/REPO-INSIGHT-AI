import express from "express";
const router = express.Router();

import * as RepositoryController from "../controllers/repository.controller.js";
import { requireAuth, requireTermsAccepted } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";

router.use(requireAuth, requireTermsAccepted);
router.get("/", RepositoryController.getAllRepositories);
router.get("/resolve", validateRequest(schemas.repositoryUrlQuery, "query"), RepositoryController.resolveRepositoryByUrl);
router.get("/:id", validateRequest(schemas.idParams, "params"), RepositoryController.getRepositoryById);
router.post("/", validateRequest(schemas.repositoryUrlBody), RepositoryController.createRepository);
router.put("/:id", validateRequest(schemas.idParams, "params"), validateRequest(schemas.updateRepositoryBody), RepositoryController.updateRepository);
router.delete("/:id", validateRequest(schemas.idParams, "params"), RepositoryController.deleteRepository);

export const repositoryRouter = router;
