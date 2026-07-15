import { Router } from 'express';
import { getClientConfig } from './config.controller.js';

export const configRouter = Router();

configRouter.get('/client', getClientConfig);
