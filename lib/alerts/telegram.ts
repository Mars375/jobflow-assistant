type JobAlertData = {
  jobTitle: string
  company: string
  location: string
  salaryText: string | null
  matchScore: number
  jobUrl: string
}

export async function sendTelegramAlert(
  chatId: string,
  data: JobAlertData,
  isImmediate: boolean
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  const prefix = isImmediate ? '[EXCELLENT]' : '[GOOD]'

  const lines: string[] = []
  lines.push(`${prefix} New job match: ${data.jobTitle}`)
  lines.push(`Score: ${data.matchScore}%`)
  lines.push(`Company: ${data.company}`)
  lines.push(`Location: ${data.location}`)
  if (data.salaryText) {
    lines.push(`Salary: ${data.salaryText}`)
  }
  lines.push('')
  lines.push(data.jobUrl)

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      disable_web_page_preview: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Telegram API failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`)
  }

  return await response.json().catch(() => ({}))
}
