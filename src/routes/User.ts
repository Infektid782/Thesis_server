import express from 'express';
import controller from '../controllers/User';
import verifyToken from '../middleware/VerifyToken';

const router = express.Router();

router.get('/get/', verifyToken, controller.readUser);
router.get('/get/all', controller.readAllUsers);
router.patch('/update/', verifyToken, controller.updateUser);
router.patch('/updatePassword/', verifyToken, controller.updatePassword);
router.delete('/delete/', verifyToken, controller.deleteUser);

export = router;
