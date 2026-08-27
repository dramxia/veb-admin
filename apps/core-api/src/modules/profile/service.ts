import type { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema, profileSchema } from '@/lib/validation';

type ProfileUpdateData = z.infer<typeof profileSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

const profileSelect = {
  id: true,
  username: true,
  nickname: true,
  email: true,
  avatar: true,
} as const;

export function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: profileSelect,
  });
}

export function updateProfile(userId: string, data: ProfileUpdateData) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  });
}

export async function changePassword(userId: string, data: ChangePasswordData) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError();
  const valid = await bcrypt.compare(data.oldPassword, user.passwordHash);
  if (!valid) throw new AuthError('原密码不正确');
  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { id: user.id };
}
