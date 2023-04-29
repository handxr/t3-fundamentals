import { z } from "zod";

import {
  authedProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { type User } from "@clerk/nextjs/dist/api";
import { TRPCError } from "@trpc/server";

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 10,
  updateAgeOnGet: true,
});

const filterUserForClient = (user: User) => ({
  id: user.id,
  username: user.username,
  profilePicture: user.profileImageUrl,
});

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type Post } from "@prisma/client";
import { LRUCache } from "lru-cache";

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author || !author.username)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author not found",
      });

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

type PostWithAuthor = {
  post: Post;
  author: {
    id: string;
    username: string;
    profilePicture: string;
  };
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const postsInCache = cache.get("posts") as PostWithAuthor[];

    if (postsInCache) {
      console.log("returning from cache");
      return postsInCache;
    }

    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("returning from db");
    const postsWithUserData = await addUserDataToPosts(posts);
    cache.set("posts", postsWithUserData);
    return postsWithUserData;
  }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (cache.has(input.userId)) {
        console.log("returning from cache");
        return cache.get(input.userId) as PostWithAuthor[];
      }

      const posts = await ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        take: 100,
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log("returning from db");
      const postsWithUserData = await addUserDataToPosts(posts);
      cache.set(input.userId, postsWithUserData);
      return postsWithUserData;
    }),

  create: authedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.userId;

      const { success } = await ratelimit.limit(user);

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You are doing that too much. Try again later.",
        });
      }

      console.log("deleting from cache");
      cache.delete("posts");

      const post = await ctx.prisma.post.create({
        data: {
          content: input.content,
          authorId: user,
        },
      });

      return post;
    }),
});
