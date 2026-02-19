type JobAlertData = {
  jobTitle: string
  company: string
  location: string
  salaryText: string | null
  matchScore: number
  jobUrl: string
}

export async function sendSlackAlert(webhookUrl: string, data: JobAlertData, isImmediate: boolean) {
  const prefix = isImmediate ? '[EXCELLENT]' : '[GOOD]'
  const urgency = isImmediate ? '*Excellent match*' : '*Good match*'

  const message = {
    text: `${prefix} New job match: ${data.jobTitle}`,
    attachments: [
      {
        color: data.matchScore >= 90 ? '36a64f' : '3b82f6',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${data.jobTitle}*\n${urgency} — ${data.matchScore}%`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Company:*\n${data.company}` },
              { type: 'mrkdwn', text: `*Location:*\n${data.location}` },
              ...(data.salaryText ? [{ type: 'mrkdwn', text: `*Salary:*\n${data.salaryText}` }] : []),
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: "View Job" },
                url: data.jobUrl,
                action_id: 'view_job_button',
              },
            ],
          },
        ],
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`)
  }

  return await response.text().catch(() => '')
}
