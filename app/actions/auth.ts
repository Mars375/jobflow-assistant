'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { registerSchema, loginSchema } from '@/lib/auth/validation'
import { generateVerificationToken, storeVerificationToken } from '@/lib/auth/tokens'
import { sendVerificationEmail } from '@/lib/email'
import { createSession, clearSession } from '@/lib/auth/session'
import { FormState } from '@/types/form'

export async function register(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate input
  const validatedFields = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    gdprConsent: formData.get('gdprConsent') === 'true'
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed'
    }
  }

  const { name, email, password } = validatedFields.data

  // 2. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return {
      message: 'An account with this email already exists'
    }
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(password)

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      gdprConsentedAt: new Date(),
      consentedToPrivacyPolicy: true
    }
  })

  // 5. Generate and store verification token
  const token = generateVerificationToken()
  await storeVerificationToken(user.email, token)

  // 6. Send verification email
  await sendVerificationEmail(user.email, token)

  // 7. Redirect to check-email page
  redirect('/register/check-email')
}

export async function login(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate input
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'true'
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed'
    }
  }

  const { email, password, rememberMe } = validatedFields.data

  // 2. Find user by email (exclude soft-deleted users)
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null }
  })

  if (!user) {
    return { message: 'Email ou mot de passe incorrect' }
  }

  // 3. Verify password
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { message: 'Email ou mot de passe incorrect' }
  }

  // 4. Create session (access token + optional refresh token)
  await createSession(user.id, rememberMe ?? false)

  // 5. Redirect to dashboard
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  await clearSession()
  redirect('/login')
}
