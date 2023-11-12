import type { User, Post } from "@prisma/client";

import { prisma } from "~/server/db.server";
import {
  convertUrlSlug,
  isEmptyOrNotExist,
  removeEmptyObjectProperties,
} from "~/utils";

export type { Post } from "@prisma/client";

export function getPost({
  id,
  userId,
}: Pick<Post, "id"> & {
  userId: User["id"];
}) {
  return prisma.post.findFirst({
    where: { id, userId },
  });
}

export function getPostBySlug(slug: string, userId?: string) {
  const query = isEmptyOrNotExist(userId) ? { slug } : { slug, userId };

  return prisma.post.findFirst({
    where: query,
    include: { user: true },
  });
}

export function getPostListItems({
  userId,
  query,
}: {
  userId: User["id"];
  query?: string;
}) {
  const whereQuery = isEmptyOrNotExist(query)
    ? { userId }
    : {
        userId,
        AND: {
          slug: {
            contains: convertUrlSlug(query),
          },
        },
      };

  return prisma.post.findMany({
    where: whereQuery,
    orderBy: { updatedAt: "desc" },
  });
}

export function getPublishPosts(option?: object) {
  return prisma.post.findMany({
    where: { isPublish: true, ...option },
    include: { user: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createPost({
  title,
  preface,
  body,
  slug,
  isPublish = false,
  userId,
  coverImage,
}: Pick<
  Post,
  "body" | "title" | "preface" | "isPublish" | "slug" | "coverImage"
> & {
  userId: User["id"];
}) {
  return prisma.post.create({
    data: {
      title,
      preface,
      body,
      isPublish,
      slug,
      coverImage,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function updatePost({
  id,
  title,
  preface,
  body,
  slug,
  isPublish = false,
  coverImage = null,
}: Pick<
  Post,
  "id" | "title" | "preface" | "body" | "slug" | "isPublish" | "coverImage"
>) {
  return prisma.post.update({
    where: {
      id,
    },
    data: removeEmptyObjectProperties({
      title,
      preface,
      body,
      isPublish,
      slug,
      coverImage,
    }),
  });
}

export function deletePostBySlug({
  slug,
  userId,
}: Pick<Post, "slug"> & { userId: User["id"] }) {
  return prisma.post.deleteMany({
    where: { slug, userId },
  });
}
