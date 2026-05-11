import { Router } from 'express';
import {joinElite} from '../controllers/elite.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';



const eliteRouter = Router();

eliteRouter.post('/signup', verifyToken, joinElite);

export default eliteRouter;