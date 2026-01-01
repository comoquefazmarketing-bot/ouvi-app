import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { username } = await req.json()
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
    const CHAT_ID = "-1003229157207" 

    const message = `🌟 *BEM-VINDO AO ECOSSISTEMA OUVI*\n\n🎧 *@${username}* acaba de sintonizar com a gente!\n\n_Sinta a vibração, a voz agora é sua._`

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    })

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
