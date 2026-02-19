import 'server-only'
import { prisma } from '@/lib/db'

/**
 * Delete a user account and all associated data.
 * Uses hard-delete (GDPR right to erasure — no soft delete, remove all data).
 * Per CONTEXT.md: immediate deletion, no grace period.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Delete all sessions (hard delete — no need to keep)
    await tx.session.deleteMany({ where: { userId } })

    // 2. Delete all verification tokens for user's email
    const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (user) {
      await tx.verificationToken.deleteMany({ where: { identifier: user.email } })
    }

    // 3. Delete all deletion requests (hard delete)
    await tx.deletionRequest.deleteMany({ where: { userId } })

    // 4. Hard delete the user (GDPR right to erasure — no soft delete, remove all data)
    await tx.user.delete({ where: { id: userId } })
  })
}
