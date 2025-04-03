import prisma from "@/config/db/prisma";
import { Token } from "@prisma/client";

export async function isEmailTaken(
  email: string,
  excludeUserId?: string,
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: excludeUserId,
      },
    },
  });
  return !!user;
}

export async function getUserFullName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return `${user.name}`;
}

/**
 * Create a new token
 * @param {Omit<Token, "id" | "createdAt" | "updatedAt">} data - Token data excluding id, createdAt, and updatedAt
 * @returns {Promise<Token>}
 */
export async function createToken(
  data: Omit<Token, "id" | "createdAt" | "updatedAt">,
): Promise<Token> {
  return await prisma.token.create({
    data,
  });
}

export async function getTokenById(id: string): Promise<Token | null> {
  return await prisma.token.findUnique({
    where: { id },
  });
}

export async function updateToken(
  id: string,
  data: Partial<Token>,
): Promise<Token> {
  return await prisma.token.update({
    where: { id },
    data,
  });
}

export async function deleteToken(id: string): Promise<Token> {
  return await prisma.token.delete({
    where: { id },
  });
}

export async function findTokensByUserId(userId: string): Promise<Token[]> {
  return await prisma.token.findMany({
    where: { userId },
  });
}
