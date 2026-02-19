import { Html } from '@react-email/html'
import { Button } from '@react-email/button'

interface VerificationEmailProps {
  verificationUrl: string
  userEmail: string
  language: 'en' | 'fr'
}

const translations = {
  fr: {
    title: 'Vérifiez votre adresse email',
    greeting: 'Bonjour,',
    body: 'Merci de vous être inscrit sur JobFlow Assistant. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :',
    buttonText: 'Vérifier mon adresse email',
    expiry: 'Ce lien expire dans 15 minutes.',
    ignore: "Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.",
    goodbye: 'À bientôt,',
    teamName: "L'équipe JobFlow Assistant",
  },
  en: {
    title: 'Verify your email address',
    greeting: 'Hello,',
    body: 'Thank you for signing up for JobFlow Assistant. Click the button below to verify your email address:',
    buttonText: 'Verify my email',
    expiry: 'This link expires in 15 minutes.',
    ignore: 'If you did not request this verification, you can safely ignore this email.',
    goodbye: 'Best regards,',
    teamName: 'JobFlow Assistant Team',
  },
}

export default function VerificationEmail({
  verificationUrl,
  userEmail,
  language = 'fr',
}: VerificationEmailProps) {
  const t = translations[language]

  return (
    <Html lang={language}>
      <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          {t.title}
        </h1>
        <p style={{ marginBottom: '16px' }}>{t.greeting}</p>
        <p style={{ marginBottom: '16px', color: '#374151' }}>{userEmail}</p>
        <p style={{ marginBottom: '24px' }}>{t.body}</p>
        <Button
          href={verificationUrl}
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
