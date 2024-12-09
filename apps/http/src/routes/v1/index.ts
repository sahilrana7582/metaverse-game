import express, { Router } from 'express';
import { userRouter } from './user';
import { spaceRouter } from './space';
import { adminRouter } from './admin';
import { SigninSchema, SignupSchema } from '../../types';
import { client } from '../..';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { KEY } from '../../config';
import { adminMiddleware } from '../../middlerwares/admin';
export const router = Router();

router.route('/signup').post(async (req, res) => {
  const parsedData = SignupSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      success: false,
      message: parsedData.error,
    });
    return;
  }

  const hashedPass = await bcrypt.hash(req.body.password, 5);

  try {
    const user = await client.user.create({
      data: {
        username: parsedData.data.username,
        password: hashedPass,
        role: parsedData.data.type,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: false,
      message: 'Somthing Went Wrong',
      e,
    });
  }
});

router.route('/signin').post(async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(403).json({
      success: false,
      message: 'Not Able to Sign In\n' + parsedData.error,
    });
    return;
  }

  try {
    const user = await client.user.findUnique({
      where: {
        username: req.body.username,
      },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      res.status(403).json({
        success: false,
        message: 'Something Went Wrong Try Again',
      });
      return;
    }

    const validatePass = await bcrypt.compare(req.body.password, user.password);
    if (!validatePass) {
      res.status(403).json({
        success: false,
        message: 'Password is Not Correct',
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      KEY
    );

    res.status(200).json({
      status: true,
      data: {
        user,
        token,
      },
    });
  } catch (e) {
    res.status(403).json({
      status: true,
    });
  }
});

router
  .route('/element')
  .post((req, res) => {
    res.status(200).json({
      status: true,
    });
  })
  .get((req, res) => {
    res.status(200).json({
      success: true,
    });
  });

router.route('/avatars').get(async (req, res) => {
  try {
    const avatars = await client.avatar.findMany();

    res.status(200).json({
      success: true,
      avatars,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Get All The Avatars',
    });
  }
});

router.use('/user', userRouter);
router.use('/admin', adminRouter);
router.use('/space', spaceRouter);
