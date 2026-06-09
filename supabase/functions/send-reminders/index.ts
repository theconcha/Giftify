import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = 'https://giftify-lake.vercel.app'

interface ReminderRow {
  user_id: string
  user_email: string
  occasion_id: string
  occasion_name: string
  occasion_date: string
  days_until: number
  person_first_name: string | null
  person_last_name: string | null
}

interface OccasionGroup {
  id: string
  name: string
  date: string
  daysUntil: number
  people: string[]
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function buildEmailHtml(occasions: OccasionGroup[]): string {
  const cards = occasions.map(o => {
    const peopleStr = o.people.length > 0 ? o.people.join(', ') : 'No people linked'
    const daysLabel = o.daysUntil === 1 ? 'tomorrow' : `in ${o.daysUntil} days`
    return `
      <div style="background:#ffffff;border:1px solid #E8E0D8;border-radius:12px;padding:16px 20px;margin-bottom:12px;">
        <p style="margin:0 0 4px 0;font-size:17px;font-weight:700;color:#2D2420;">${o.name}</p>
        <p style="margin:0 0 6px 0;font-size:14px;font-weight:600;color:#C2714F;">${formatDate(o.date)} &middot; ${daysLabel}</p>
        <p style="margin:0;font-size:13px;color:#8B7355;">For: ${peopleStr}</p>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Upcoming Occasions – Giftify</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF6F1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#FAF6F1;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="display:inline-block;background:#C2714F;color:#ffffff;font-size:20px;font-weight:800;padding:8px 20px;border-radius:12px;">
            🎁 Giftify
          </span>
        </td></tr>

        <tr><td style="padding-bottom:6px;">
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#2D2420;line-height:1.25;">You have upcoming occasions</h1>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:15px;color:#8B7355;line-height:1.5;">Here's a heads-up so you have time to plan the perfect gift.</p>
        </td></tr>

        <tr><td>${cards}</td></tr>

        <tr><td style="padding:24px 0 32px;text-align:center;">
          <a href="${APP_URL}" style="display:inline-block;background:#C2714F;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 30px;border-radius:12px;">
            Open Giftify
          </a>
        </td></tr>

        <tr><td style="padding-top:20px;border-top:1px solid #E8E0D8;text-align:center;">
          <p style="margin:0;font-size:12px;color:#8B7355;line-height:1.6;">
            You're receiving this because you set up email reminders in Giftify.<br>
            <a href="${APP_URL}/settings?tab=notifications" style="color:#C2714F;text-decoration:none;">Update notification preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: rows, error } = await supabase.rpc('get_reminder_occasions')
    if (error) throw error

    if (!rows?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No reminders due today' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Group rows by user, then by occasion
    const byUser = new Map<string, { email: string; occasions: Map<string, OccasionGroup> }>()
    for (const row of rows as ReminderRow[]) {
      if (!byUser.has(row.user_id)) {
        byUser.set(row.user_id, { email: row.user_email, occasions: new Map() })
      }
      const user = byUser.get(row.user_id)!
      if (!user.occasions.has(row.occasion_id)) {
        user.occasions.set(row.occasion_id, {
          id: row.occasion_id,
          name: row.occasion_name,
          date: row.occasion_date,
          daysUntil: row.days_until,
          people: [],
        })
      }
      if (row.person_first_name) {
        const occ = user.occasions.get(row.occasion_id)!
        const fullName = [row.person_first_name, row.person_last_name].filter(Boolean).join(' ')
        if (!occ.people.includes(fullName)) occ.people.push(fullName)
      }
    }

    let sentCount = 0
    const errors: string[] = []

    for (const [_userId, { email, occasions }] of byUser) {
      if (!email) continue

      const occasionList = [...occasions.values()].sort((a, b) => a.daysUntil - b.daysUntil)
      const first = occasionList[0]
      const subject = occasionList.length === 1
        ? `Reminder: ${first.name} is ${first.daysUntil === 1 ? 'tomorrow' : `in ${first.daysUntil} days`}`
        : `You have ${occasionList.length} upcoming occasions – Giftify`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Giftify <onboarding@resend.dev>',
          to: [email],
          subject,
          html: buildEmailHtml(occasionList),
        }),
      })

      if (res.ok) {
        sentCount++
      } else {
        const body = await res.text()
        errors.push(`${email}: ${body}`)
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, errors }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
