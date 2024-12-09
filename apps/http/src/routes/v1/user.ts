import { Router } from 'express';
import { router } from '.';
import { UpdateMetadataSchema } from '../../types';
import { adminMiddleware } from '../../middlerwares/admin';
import { client } from '../..';
import { userMiddleware } from '../../middlerwares/user';

export const userRouter = Router();

userRouter.route('/metadata').post(userMiddleware, async (req, res) => {
  console.log(
    '0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0'
  );
  try {
    const parsedBody = UpdateMetadataSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        success: false,
        message:
          'Validation failed: ' +
          parsedBody.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const userId = req.userId;

    if (parsedBody.data.avatarId) {
      const avatarExists = await client.avatar.findUnique({
        where: { id: parsedBody.data.avatarId },
      });

      if (!avatarExists) {
        res.status(404).json({
          success: false,
          message:
            'Invalid avatar ID provided. Please ensure the avatar exists.',
        });
        return;
      }
    }

    const updatedUser = await client.user.update({
      where: {
        id: userId,
      },
      data: parsedBody.data,
    });

    res.status(200).json({
      success: true,
      message: 'Metadata updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
});

userRouter.route('/metadata/bulk').get(async (req, res) => {
  const userIdString = (req.query.ids ?? '[]') as string;
  const userIds = userIdString.slice(1, userIdString?.length - 1).split(',');
  console.log(userIds);
  const metadata = await client.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      avatar: true,
      id: true,
    },
  });

  res.json({
    avatars: metadata.map((m) => ({
      userId: m.id,
      avatarId: m.avatar?.imageUrl,
    })),
  });
});
