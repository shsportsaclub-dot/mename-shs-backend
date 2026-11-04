// Minimal Telegram Bot API client (https://core.telegram.org/bots/api) with flood control:
// - honours 429 retry_after
// - a global pace (~25 requests/second, under Telegram's ~30/s bot limit)
// - card edits per chat are coalesced: only the newest text is sent, at most ~1 per second per chat
export function telegram({ token, base = 'https://api.telegram.org', log = () => {} }) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const url = m => `${base}/bot${token}/${m}`;
  let nextSlot = 0;
  const pace = async () => {
    const now = Date.now(), wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + 40;
    if (wait) await new Promise(r => setTimeout(r, wait));
  };
  async function call(method, body = {}, tries = 3) {
    for (let i = 0; i < tries; i++) {
      await pace();
      let j;
      try {
        const r = await fetch(url(method), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
        j = await r.json();
      } catch (e) {
        log('telegram', method, 'network error', e.message);
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      if (j.ok) return j.result;
      const after = j.parameters?.retry_after;
      if (j.error_code === 429 && after) { await new Promise(r => setTimeout(r, (after + 0.5) * 1000)); continue; }
      const err = Object.assign(new Error(j.description || 'Telegram error'), { code: j.error_code });
      throw err;
    }
    throw new Error(`Telegram ${method} failed after ${tries} tries`);
  }

  // Coalesced live-card editing.
  const pending = new Map(); // chatId -> { messageId, text, markup, timer, lastAt, onGone }
  function editCard(chatId, messageId, text, markup, onGone) {
    const p = pending.get(chatId) || { lastAt: 0 };
    Object.assign(p, { messageId, text, markup, onGone });
    pending.set(chatId, p);
    if (p.timer) return;
    const due = Math.max(0, p.lastAt + 1100 - Date.now());
    p.timer = setTimeout(async () => {
      p.timer = null; p.lastAt = Date.now();
      const { messageId: id, text: t, markup: mk, onGone: gone } = p;
      try {
        await call('editMessageText', { chat_id: chatId, message_id: id, text: t, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, reply_markup: mk });
      } catch (e) {
        if (/not modified/i.test(e.message)) return;
        if (/message to edit not found|message can't be edited|MESSAGE_ID_INVALID/i.test(e.message)) { gone && gone(); return; }
        if (e.code === 403) { gone && gone('blocked'); return; }
        log('telegram', 'edit failed', e.message);
      }
    }, due);
  }
  const send = (chat_id, text, extra = {}) => call('sendMessage', { chat_id, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra });
  const answer = (callback_query_id, text) => call('answerCallbackQuery', { callback_query_id, ...(text ? { text } : {}) }).catch(() => {});
  return { call, send, answer, editCard, _pending: pending };
}
