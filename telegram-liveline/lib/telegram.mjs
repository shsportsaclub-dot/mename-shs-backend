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
  // Event animations: upload the MP4 once, then reuse Telegram's file_id for every chat.
  const fileIds = new Map();
  async function upload(method, field, chat_id, filePath, extra) {
    const fs = await import('node:fs/promises');
    const fd = new FormData();
    fd.append('chat_id', String(chat_id));
    for (const [k, v] of Object.entries(extra)) fd.append(k, typeof v === 'string' ? v : JSON.stringify(v));
    fd.append(field, new Blob([await fs.readFile(filePath)], { type: 'video/mp4' }), filePath.split('/').pop());
    await pace();
    const r = await fetch(url(method), { method: 'POST', body: fd, signal: AbortSignal.timeout(30000) });
    const j = await r.json();
    if (!j.ok) throw Object.assign(new Error(j.description || 'upload failed'), { code: j.error_code });
    return j.result;
  }
  async function sendAnim(chat_id, name, filePath, caption, effect) {
    const base = { caption, parse_mode: 'HTML', ...(effect && Number(chat_id) > 0 ? { message_effect_id: effect } : {}) };
    const go = async extra => {
      const id = fileIds.get(name);
      if (id) return call('sendAnimation', { chat_id, animation: id, ...extra });
      const res = await upload('sendAnimation', 'animation', chat_id, filePath, extra);
      const fid = res.animation?.file_id || res.document?.file_id || res.video?.file_id;
      if (fid) fileIds.set(name, fid);
      return res;
    };
    try { return await go(base); }
    catch (e) {
      if (base.message_effect_id && /effect/i.test(e.message)) { const { message_effect_id, ...rest } = base; return go(rest); }
      throw e;
    }
  }
  const send = (chat_id, text, extra = {}) => call('sendMessage', { chat_id, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra });
  const answer = (callback_query_id, text) => call('answerCallbackQuery', { callback_query_id, ...(text ? { text } : {}) }).catch(() => {});
  return { call, send, answer, editCard, sendAnim, _fileIds: fileIds, _pending: pending };
}
