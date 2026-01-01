export const notifyArrival = async (username: string) => {
  try {
    await fetch('https://vaxjxggdnriwwllbxmoi.supabase.co/functions/v1/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  } catch (err) {
    console.error('Erro ao avisar Telegram:', err);
  }
};
