import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL is required')

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    // Fetch the page content
    let html = ''
    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Giftify/1.0)' },
      })
      html = await pageRes.text()
    } catch {
      return new Response(
        JSON.stringify({ error: "Could not fetch that URL. Please fill in the details manually." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Focus on the first 8000 chars where meta/OG tags and product info typically live
    const truncated = html.substring(0, 8000)

    const prompt = `Extract product information from this webpage HTML. Return ONLY a JSON object with these exact fields:
- name: the product name (string)
- price: the price as a number only, no currency symbol (number or null)
- photo_url: the main product image URL, must be a full absolute URL starting with http (string or null)

If you cannot confidently find a field, use null. Return only valid JSON, no explanation, no markdown.

HTML:
${truncated}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not extract product data. Please fill in the details manually." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const productData = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
