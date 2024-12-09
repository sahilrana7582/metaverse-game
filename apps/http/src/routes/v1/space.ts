import { Router } from 'express';
import { router } from '.';
import {
  AddElementSchema,
  CreateElementSchema,
  CreateSpaceSchema,
  DeleteElementSchema,
} from '../../types';
import { client } from '../..';
import { userMiddleware } from '../../middlerwares/user';

export const spaceRouter = Router();

spaceRouter.route('/').post(userMiddleware, async (req, res) => {
  try {
    const parseData = CreateSpaceSchema.safeParse(req.body);

    if (!parseData.success) {
      res.status(403).json({
        success: false,
        message: 'Space Body is Not Valid',
        errors: parseData.error.errors.map((e) => e.message),
      });
      return;
    }

    const creatorId = req.userId;
    if (!creatorId) {
      res.status(404).json({
        success: false,
        message: 'Creator ID is required.',
      });
      return;
    }
    const spaceData = {
      name: parseData.data.name,
      width: parseInt(parseData.data.dimensions.split('x')[0]),
      height: parseInt(parseData.data.dimensions.split('x')[1]),
      creatorId,
    };

    if (!parseData.data.mapId) {
      const space = await client.space.create({
        data: { ...spaceData },
      });
      res.status(200).json({
        success: true,
        message: 'Space Created',
        spaceId: space.id,
      });

      return;
    }

    const map = await client.map.findUnique({
      where: {
        id: parseData.data.mapId,
      },
      select: {
        mapElements: true,
      },
    });

    if (!map || !map.mapElements || map.mapElements.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Not Able to Find the map',
      });
      return;
    }

    const space = await client.$transaction(async () => {
      const space = await client.space.create({
        data: {
          name: parseData.data.name,
          width: parseInt(parseData.data.dimensions.split('x')[0]),
          height: parseInt(parseData.data.dimensions.split('x')[1]),
          creatorId,
        },
      });

      await client.spaceElements.createMany({
        data: map?.mapElements
          ? map.mapElements.map((e) => ({
              spaceId: space.id,
              elementId: e.elementId,
              x: e.x || 1,
              y: e.y || 1,
            }))
          : [],
      });

      return space;
    });

    res.status(200).json({
      success: true,
      spaceId: space.id,
    });
  } catch (e) {
    console.error('Error creating space:', e); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the space.',
    });
  }
});

spaceRouter.route('/element').post(userMiddleware, async (req, res) => {
  try {
    const parsedData = AddElementSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    const space = await client.space.findUnique({
      where: {
        id: req.body.spaceId,
        creatorId: req.userId!,
      },
      select: {
        width: true,
        height: true,
      },
    });

    if (
      req.body.x < 0 ||
      req.body.y < 0 ||
      req.body.x > space?.width! ||
      req.body.y > space?.height!
    ) {
      res.status(400).json({ message: 'Point is outside of the boundary' });
      return;
    }

    if (!space) {
      res.status(400).json({ message: 'Space not found' });
      return;
    }
    await client.spaceElements.create({
      data: {
        spaceId: req.body.spaceId,
        elementId: req.body.elementId,
        x: req.body.x,
        y: req.body.y,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Element Created',
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Able to Create the Element',
    });
  }
});

spaceRouter.delete('/element/ele', userMiddleware, async (req, res) => {
  try {
    const parseData = DeleteElementSchema.safeParse(req.body);
    console.log('');
    console.log(req.body);
    console.log(parseData);

    if (!parseData.success) {
      res.status(404).json({
        message: 'Validation Delete Element Error',
      });
      return;
    }

    const spaceElements = await client.spaceElements.findFirst({
      where: {
        id: req.body.id,
      },
      select: {
        space: true,
      },
    });

    if (spaceElements?.space.creatorId !== req.userId) {
      res.status(401).json({
        message: "Space is not Owned By You So Can't Delete",
      });
      return;
    }

    await client.spaceElements.delete({
      where: {
        id: req.body.id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Element Deleted From the space',
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Not Able to Delete element from the space',
    });
  }
});

spaceRouter.route('/all/spaces').get(userMiddleware, async (req, res) => {
  try {
    console.log('Hittinf');
    const spaces = await client.space.findMany({
      where: {
        creatorId: req.userId,
      },
    });

    res.status(200).json({
      success: true,
      spaces,
    });
  } catch (e) {
    res.status(500).json({
      success: true,
      message: 'Not Ale to Get All Spaces' + e,
    });
  }
});

spaceRouter
  .route('/:spaceId')
  .get(userMiddleware, async (req, res) => {
    try {
      console.log(req.params);
      const space = await client.space.findUnique({
        where: {
          id: req.params.spaceId,
        },
        include: {
          elements: {
            include: {
              element: true,
            },
          },
        },
      });

      if (!space) {
        res.status(404).json({
          message: 'Space Not Found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          dimensions: `${space.width}x${space.height}`,
          elements: space.elements.map((e) => ({
            id: e.id,
            elements: e.element,
            x: e.x,
            y: e.y,
          })),
        },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: 'Not Able to get all the spaces',
      });
    }
  })
  .delete(userMiddleware, async (req, res) => {
    try {
      const space = await client.space.findUnique({
        where: {
          id: req.params.spaceId,
        },
        select: {
          creatorId: true,
        },
      });

      if (!space) {
        res.status(404).json({
          success: false,
          message: 'No Space Available',
        });
        return;
      }

      if (space?.creatorId !== req.userId) {
        res.status(403).json({
          success: false,
          message: 'Not Able to Delete the Space becaue Unauthorized',
        });
        return;
      }

      await client.space.delete({
        where: {
          id: req.params.spaceId,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Space Created Successfully',
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: 'Not Able to delete the space',
      });
    }
  });
