import 'server-only'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import VerificationEmail from '@/emails/verification-email'
import PasswordResetEmail from '@/emails/password-reset-email'

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (resendClient) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'JobFlow Assistant <noreply@jobflow-assistant.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

  const html = await render(
    VerificationEmail({
      verificationUrl,
      userEmail: email,
      language: 'fr',
    })
  )

  return await sendEmail({
    to: email,
    subject: 'Vérifiez votre adresse email',
    html,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

  const html = await render(
    PasswordResetEmail({
      resetUrl,
      language: 'fr',
    })
  )

  return await sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html,
  })
}

export async function sendDeletionConfirmationEmail(email: string, token: string) {
  const deletionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/confirm-deletion?token=${token}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Confirmation de suppression de compte</h1>
      <p>Bonjour,</p>
      <p>Vous avez demandé la suppression de votre compte JobFlow Assistant.</p>
      <p>Pour confirmer cette action irréversible, cliquez sur le bouton ci-dessous :</p>
      <a href="${deletionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Confirmer la suppression
      </a>
      <p><small>Ce lien expire dans 7 jours.</small></p>
      <p><small>Si vous n'avez pas demandé cette suppression, vous pouvez ignorer cet email et votre compte ne sera pas supprimé.</small></p>
      <p>Cordialement,</p>
      <p><strong>L'équipe JobFlow Assistant</strong></p>
    </div>
  `

  return await sendEmail({
    to: email,
    subject: 'Confirmation de suppression de compte',
    html,
  })
}
