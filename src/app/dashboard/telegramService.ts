/**
 * PROJETO OUVI - Serviço de Notificação Elite
 * Este serviço comunica com a Edge Function do Supabase
 * para alertar o Mestre sobre novas sintonizações.
 */

export const notifyArrival = async (username: string) => {
  try {
    // A chamada vai para a sua Edge Function que centraliza o disparo para o Telegram
    const response = await fetch('https://vaxjxggdnriwwllbxmoi.supabase.co/functions/v1/notify-telegram', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
        // Se sua função exigir a Service Role Key ou Anon Key, adicione aqui:
        // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ 
        username,
        // Passamos metadados extras se a função precisar
        timestamp: new Date().toISOString(),
        project: "OUVI"
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta da rede: ${response.statusText}`);
    }

    console.log(`🎙️ Sinal de chegada enviado: ${username}`);
  } catch (err) {
    // Erro silencioso para o usuário, mas logado para o desenvolvedor
    console.error('Erro ao avisar Telegram:', err);
  }
};