import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";


export const getPosts = async (req, res) => {
  try {
    const { type, city, property, minPrice, maxPrice, bedroom } = req.query;




    let whereClause = {};


    if (type) whereClause.type = type;
    if (city) whereClause.city = { contains: city, mode: 'insensitive' };
    if (property) whereClause.property = property;
    if (bedroom) whereClause.bedroom = { gte: parseInt(bedroom) };

    if (minPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseInt(minPrice);
      // if (maxPrice) whereClause.price.lte = parseInt(maxPrice);
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: { postDetail: true },
    });

    if(posts.length === 0) {
    
      // provode all posts in the database
    
      const posts = await prisma.post.findMany({
        include: { postDetail: true },
        take: 1000,
      });


  
      res.status(200).json({message: "No posts found", posts:posts});
      return;
    }

    res.json(posts);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// export const getPosts = async (req, res) => {
//   try {
//     const { type, city, property, minPrice, maxPrice, bedroom } = req.query;

//     let whereClause = {};

//     if (type) whereClause.type = type;
//     if (city) whereClause.city = { contains: city, mode: 'insensitive' };
//     if (property) whereClause.property = property;
//     if (bedroom) whereClause.bedroom = { gte: parseInt(bedroom) };

//     if (minPrice || maxPrice) {
//       whereClause.price = {};
//       if (minPrice) whereClause.price.gte = parseInt(minPrice);
//       if (maxPrice) whereClause.price.lte = parseInt(maxPrice);
//     }

//     const posts = await prisma.post.findMany({
//       where: whereClause,
//       include: { postDetail: true },
//     });

//     res.json(posts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// export const getPosts = async (req, res) => {
//   try {
//     const { type, city, property, minPrice, maxPrice, bedroom } = req.query;

//     let whereClause = {};

//     if (type) whereClause.type = type;
//     if (city) whereClause.city = { contains: city, mode: 'insensitive' };
//     if (property) whereClause.property = property;
//     if (bedroom) whereClause.bedroom = { gte: parseInt(bedroom) };

//     if (minPrice || maxPrice) {
//       whereClause.price = {};
//       if (minPrice) whereClause.price.gte = parseInt(minPrice);
//       if (maxPrice) whereClause.price.lte = parseInt(maxPrice);
//     }

//     const posts = await prisma.post.findMany({
//       where: whereClause,
//       include: { postDetail: true },
//     });

//     res.json(posts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let isSaved = false;
    const token = req.cookies?.token;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              postId: id,
              userId: payload.id,
            },
          },
        });
        isSaved = !!saved;
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    }

    res.status(200).json({ ...post, isSaved });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        postDetail: {
          create: body.postDetail,
        },
      },
    });
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update posts" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
