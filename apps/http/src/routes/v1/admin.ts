import { Router } from 'express';
import { router } from '.';
import { adminMiddleware } from '../../middlerwares/admin';
import {
  CreateAvatarSchema,
  CreateElementSchema,
  CreateMapSchema,
  DeleteElementSchema,
  UpdateElementSchema,
} from '../../types';
import { client } from '../..';

export const adminRouter = Router();

adminRouter.route('/element').post(adminMiddleware, async (req, res) => {
  try {
    const parsedData = CreateElementSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(404).json({
        message: 'Element Creation Validation Wrong',
      });
      return;
    }

    const element = await client.element.create({
      data: req.body,
    });

    console.log('leaving<<<<<<<<<<');

    res.status(200).json({
      success: true,
      data: {
        id: element.id,
      },
    });
    console.log('leaving>>>>>>>>>>>>>>>>>>>>');
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Able to Create New Element',
    });
  }
});
// .delete(adminMiddleware, async (req, res) => {
//   try {
//     const parsedData = DeleteElementSchema.safeParse(req.body);
//     if (!parsedData.success) {
//       res.status(404).json({
//         message: 'Not Able To Delete Element from the Admin',
//       });
//     }

//     await client.element.delete({
//       where: {
//         id: req.body.id,
//       },
//     });

//     res.status(200).json({
//       message: 'Element Deleted',
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: 'Not Able To Delete The Element',
//     });
//   }
// });

adminRouter
  .route('/element/:elementId')
  .put(adminMiddleware, async (req, res) => {
    try {
      const parsedData = UpdateElementSchema.safeParse(req.body);

      if (!parsedData.success) {
        res.status(404).json({
          message: 'Not Able To Update Form Validate Element from the Admin',
        });
        return;
      }
      await client.element.update({
        where: {
          id: req.params.elementId,
        },
        data: req.body,
      });
      res.status(200).json({
        success: true,
        message: 'Element Deleted',
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: 'Not Able To Update the element',
      });
    }
  });

adminRouter.route('/avatar').post(adminMiddleware, async (req, res) => {
  try {
    const parsedData = CreateAvatarSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(404).json({
        message:
          'Not Able To create avatar Form Validate Element from the Admin',
      });
    }

    const avatar = await client.avatar.create({
      data: req.body,
    });
    res.status(200).json({
      success: true,
      message: 'Created Avatar',
      avatarId: avatar.id,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Able to create Avatar',
    });
  }
});

adminRouter.route('/map').post(adminMiddleware, async (req, res) => {
  try {
    const parsedData = CreateMapSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(404).json({
        message: 'Not Able To create map Form Validate Element from the Admin',
      });
      return;
    }

    const map = await client.map.create({
      data: {
        name: req.body.name,
        width: parseInt(req.body.dimensions.split('x')[0]),
        height: parseInt(req.body.dimensions.split('x')[1]),
        thumbnail: req.body.thumbnail,
        mapElements: {
          create: req.body.defaultElements.map((e: any) => ({
            elementId: e.elementId,
            x: e.x,
            y: e.y,
          })),
        },
      },
    });
    res.status(200).json({
      success: true,
      message: 'Create map',
      id: map.id,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Able to create map',
    });
  }
});
