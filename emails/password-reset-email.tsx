import { Html } from '@react-email/html'
import { Button } from '@react-email/button'

interface PasswordResetEmailProps {
  resetUrl: string
  language: 'en' | 'fr'
}

const translations = {
  fr: {
    title: 'Réinitialisation de votre mot de passe',
    greeting: 'Bonjour,',
    body: 'Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :',
    buttonText: 'Réinitialiser mon mot de passe',
    expiry: 'Ce lien expire dans 30 minutes.',
    ignore: "Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email et votre mot de passe restera inchangé.",
    goodbye: 'À bientôt,',
    teamName: "L'équipe JobFlow Assistant",
  },
  en: {
    title: 'Password Reset Request',
    greeting: 'Hello,',
    body: 'You requested a password reset. Click the button below to create a new password:',
    buttonText: 'Reset my password',
    expiry: 'This link expires in 30 minutes.',
    ignore: 'If you did not request this reset, you can safely ignore this email and your password will remain unchanged.',
    goodbye: 'Best regards,',
    teamName: 'JobFlow Assistant Team',
  },
}

export default function PasswordResetEmail({
  resetUrl,
  language = 'fr',
}: PasswordResetEmailProps) {
  const t = translations[language]

  return (
    <Html lang={language}>
      <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          {t.title}
        </h1>
        <p style={{ marginBottom: '16px' }}>{t.greeting}</p>
        <p style={{ marginBottom: '24px' }}>{t.body}</p>
        <Button
          href={resetUrl}
          style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '6px' }}
        >
          {t.buttonText}
        </Button>
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
          <small>{t.expiry}</small>
        </p>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          <small>{t.ignore}</small>
        </p>
        <p style={{ marginTop: '24px' }}>{t.goodbye}</p>
        <p style={{ fontWeight: '600' }}>{t.teamName}</p>
      </div>
    </Html>
  )
}
