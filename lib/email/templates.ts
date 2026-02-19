import 'server-only'

import { render } from '@react-email/render'
import JobDigestEmail from '@/emails/job-digest.html'
import { generateJobDigestText } from '@/emails/job-digest.txt'
import type { DigestJob } from '@/lib/email/digest'
import { EMAIL_DIGEST_SETTINGS } from '@/lib/alerts/schema'

export async function generateJobDigestEmail(input: {
  firstName: string
  tiers: { excellent: DigestJob[]; good: DigestJob[] }
  totalJobs: number
  hasMore: boolean
  appUrl: string
}): Promise<{ html: string; text: string }> {
  const html = await render(
    JobDigestEmail({
      firstName: input.firstName,
      tiers: input.tiers,
      totalJobs: input.totalJobs,
      hasMore: input.hasMore,
      appUrl: input.appUrl,
    })
  )

  const text = generateJobDigestText({
    firstName: input.firstName,
    tiers: input.tiers,
    totalJobs: input.totalJobs,
    hasMore: input.hasMore,
    appUrl: input.appUrl,
    maxJobs: EMAIL_DIGEST_SETTINGS.MAX_JOBS,
  })

  return { html, text }
}
