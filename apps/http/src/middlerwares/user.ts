import jwt from 'jsonwebtoken';
import { KEY } from '../config';
import { NextFunction, Request, Response } from 'express';

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1];
  //   console.log(req.headers);

  if (!token) {
    res.status(403).json({ message: 'Unauthorized Token Not Availavle' });
    return;
  }

  try {
    const decoded = jwt.verify(token, KEY) as {
      role: string;
      userId: string;
    };
    // console.log(decoded);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(403).json({ message: 'Unauthorized internal Error' });
    return;
  }
};
