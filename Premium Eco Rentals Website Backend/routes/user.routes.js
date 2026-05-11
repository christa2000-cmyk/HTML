import { createUser, getAllUsers, loginUser, signinUser, confirmEmail } from '../controllers/user.controller.js';
import {Router} from 'express';




const userRouter = Router();

userRouter.post('/create', createUser);
userRouter.get('/confirm-email', confirmEmail);

userRouter.post('/login', loginUser);

userRouter.post('/signin', signinUser);


userRouter.get('/users', getAllUsers);


export default userRouter;




