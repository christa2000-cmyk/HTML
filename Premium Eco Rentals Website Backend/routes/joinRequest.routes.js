import { Router } from 'express';
import { sendJoinRequestEmail } from '../controllers/joinRequest.controller.js';

const joinRequestRouter = Router();

joinRequestRouter.post('/join', sendJoinRequestEmail);

export default joinRequestRouter;
