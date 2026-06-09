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
    const { person, occasion, giftHistory, products } = await req.json()

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    const alreadyGiven = giftHistory.map((g: any) => g.name).join(', ') || 'None'
    const productList = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      categories: p.categories,
      description: p.description,
    }))

    const prompt = `You are a thoughtful gift recommendation assistant. Help choose the best gifts from a personal product library.

Recipient profile:
${JSON.stringify(person, null, 2)}

Occasion: ${occasion ? JSON.stringify(occasion) : 'General gift'}

Products already given to this person: ${alreadyGiven}

Available products in library:
${JSON.stringify(productList, null, 2)}

Instructions:
- Recommend up to 5 products from the available library above
- Strongly prefer products NOT already given to this person
- Consider the occasion type, recipient gender/pronouns/religion if relevant, and price
- Be concise with reasons (one sentence max)
- Return ONLY a valid JSON array, no explanation, no markdown

Format: [{"id": "product-id-here", "reason": "one sentence reason"}]`

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

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
