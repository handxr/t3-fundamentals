import { z } from "zod";

import {
  authedProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { type User } from "@clerk/nextjs/dist/api";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) => ({
  id: user.id,
  username: user.username,
  profilePicture: user.profileImageUrl,
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

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
  }),

  create: authedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.userId;

      const post = await ctx.prisma.post.create({
        data: {
          content: input.content,
          authorId: user,
        },
      });

      return post;
    }),
});
