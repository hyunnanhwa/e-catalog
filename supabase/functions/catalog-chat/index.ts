// 전자카달로그 데모 — AI 채팅 Edge Function (Supabase, Deno)
// 공개 뷰어의 채팅창이 호출. Gemini API 키는 Supabase 비밀값(GEMINI_API_KEY)에만 저장되고 브라우저에는 노출되지 않음.
// 답변 근거 = 카달로그에 적힌 글 + 비공개 표(chat_private)의 'AI 참고 정보'. 대화는 chat_sessions/chat_messages에 저장(소유자만 열람).
// 배포: supabase functions deploy catalog-chat --no-verify-jwt   (공개 방문자가 로그인 없이 호출하므로 JWT 검사 끔 — 대신 아래 사용량 제한)
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const ALLOW_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';   // 예: https://계정.github.io
const LIMIT = { msgLen: 300, perSession: 40, perIpHour: 60, perCatalogDay: 1000, knowledge: 6000 };

const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

const CORS = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};
const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });

const stripTags = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
const norm = (s: string) => stripTags(s).replace(/\s+/g, ' ').trim();

function langOf(msg: string): 'ko' | 'ja' | 'zh' | 'en' {
  if (/\p{Script=Hangul}/u.test(msg)) return 'ko';
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(msg)) return 'ja';
  if (/\p{Script=Han}/u.test(msg)) return 'zh';
  return /[A-Za-z]/.test(msg) ? 'en' : 'ko';
}
const LANG_NAME = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese' };
function langOk(lang: string, r: string) {
  if (lang === 'ko') return /\p{Script=Hangul}/u.test(r) && !/\p{Script=Han}/u.test(r);
  if (lang === 'en') return !/[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(r);
  return true;
}

async function gemini(system: string, contents: unknown[], temperature: number): Promise<string> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  const call = (b: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: JSON.stringify(b), signal: AbortSignal.timeout(30000) });
  let res = await call(body);
  if (res.status === 400) {   // 모델이 thinkingConfig를 받지 않으면 빼고 재시도
    delete (body.generationConfig as Record<string, unknown>).thinkingConfig;
    res = await call(body);
  }
  if (!res.ok) { console.error('gemini', res.status, (await res.text()).slice(0, 300)); return ''; }
  const j = await res.json();
  const parts = j?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? '').join('').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, err: 'POST only' }, 405);
  let input: Record<string, unknown> = {};
  try { input = await req.json(); } catch { /* 빈 요청 */ }

  const token = String(input.token ?? '');
  const elId = String(input.el ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  const sid = String(input.sid ?? '').toLowerCase();
  let msg = norm(String(input.msg ?? ''));
  if (!/^[0-9a-f-]{36}$/i.test(token) || !elId || !/^[a-f0-9]{32}$/.test(sid) || !msg) return json({ ok: false, err: '잘못된 요청입니다.' }, 400);
  msg = msg.slice(0, LIMIT.msgLen);
  const lang = langOf(msg);
  const say = (ko: string, en: string) => (lang === 'ko' ? ko : en);
  const busy = say('질문이 많아 잠시 쉬고 있어요. 잠시 후 다시 시도하시거나 문의폼을 이용해 주세요.', 'Too many messages right now. Please try again later or use the inquiry form.');
  if (!GEMINI_KEY) return json({ ok: true, reply: say('AI 설정이 아직 완료되지 않았습니다.', 'The AI assistant is not configured yet.') });

  // 카달로그 + 채팅 요소 + 근거 글
  const { data: cat } = await sb.from('catalogs').select('id,title').eq('id', token).maybeSingle();
  if (!cat) return json({ ok: false, err: '카달로그를 찾을 수 없습니다.' }, 404);
  const { data: slides } = await sb.from('slides').select('elements').eq('catalog_id', cat.id).order('sort_order');
  let chat: Record<string, unknown> | null = null;
  const seen = new Set<string>(); let know = '';
  for (const s of slides ?? []) {
    for (const e of (Array.isArray(s.elements) ? s.elements : []) as Record<string, any>[]) {
      if (e.type === 'chat' && e.id === elId) chat = e;
      const texts: string[] = [];
      if (e.type === 'text') texts.push(String(e.html ?? '').replace(/<br\s*\/?>|<\/(p|div|li)>/gi, '\n'));
      if (e.type === 'tab' && e.label) texts.push(String(e.label));
      if (e.type === 'carousel' && Array.isArray(e.images)) for (const im of e.images) {
        if (!im || typeof im !== 'object') continue;
        texts.push([im.title, im.sub, im.body].filter(Boolean).join(' - '));
        for (const b of im.boxes ?? []) texts.push(`${b?.t ?? ''}: ${b?.d ?? ''}`);
      }
      for (const t of texts) {
        const x = norm(t);
        if (x.length < 3 || seen.has(x) || know.length + x.length > LIMIT.knowledge) continue;   // 근거는 상한까지만, 채팅 요소는 끝까지 찾음
        seen.add(x); know += x + '\n';
      }
    }
  }
  if (!chat) return json({ ok: false, err: '채팅을 찾을 수 없습니다. 페이지를 새로고침해 주세요.' }, 404);
  const { data: priv } = await sb.from('chat_private').select('info').eq('catalog_id', cat.id).eq('el_id', elId).maybeSingle();

  // 사용량 제한
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 45);
  const hourAgo = new Date(Date.now() - 3600e3).toISOString(), dayAgo = new Date(Date.now() - 86400e3).toISOString();
  const { count: ipCnt } = await sb.from('chat_messages').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('role', 'user').gt('created_at', hourAgo);
  if ((ipCnt ?? 0) >= LIMIT.perIpHour) return json({ ok: true, reply: busy });
  const { count: dayCnt } = await sb.from('chat_messages').select('id', { count: 'exact', head: true }).eq('catalog_id', cat.id).eq('role', 'user').gt('created_at', dayAgo);
  if ((dayCnt ?? 0) >= LIMIT.perCatalogDay) return json({ ok: true, reply: busy });

  let { data: sess } = await sb.from('chat_sessions').select('id,msg_count').eq('sid', sid).eq('catalog_id', cat.id).maybeSingle();
  if (!sess) {
    const ins = await sb.from('chat_sessions').insert({ catalog_id: cat.id, el_id: elId, sid, ip, ua: (req.headers.get('user-agent') ?? '').slice(0, 200) }).select('id,msg_count').single();
    if (ins.error) return json({ ok: false, err: '잠시 후 다시 시도해 주세요.' }, 500);
    sess = ins.data;
  }
  if (sess.msg_count >= LIMIT.perSession) return json({ ok: true, reply: say('대화가 길어졌어요. 자세한 내용은 문의폼으로 남겨 주세요.', 'This conversation is getting long. Please leave the details through the inquiry form.') });

  const { data: hist } = await sb.from('chat_messages').select('role,content').eq('session_id', sess.id).order('created_at', { ascending: false }).limit(8);
  const system = `You are the chat assistant for the company's online catalog "${cat.title}".\n`
    + 'Rules:\n'
    + "1. Reply in the same language as the user's latest message (Korean -> Korean, English -> English, Japanese -> Japanese). Do not mix in Chinese.\n"
    + '2. Answer only from [Company information] and [Extra information]. If the answer is not there (prices, minimum order, phone numbers, delivery, etc.), say you are not sure and suggest leaving a message through the inquiry form in the catalog. Never invent facts, numbers, names or contact details.\n'
    + '3. Keep replies short: 1-3 sentences, friendly and polite. Plain text only, no markdown.\n\n'
    + `[Company information]\n${know.trim()}\n\n[Extra information]\n${String(priv?.info ?? '').trim()}\n\n`
    + `The user's next message is in ${LANG_NAME[lang]}. Your reply must be written only in ${LANG_NAME[lang]}.`;
  const contents = [...(hist ?? []).reverse().map((h) => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.content }] })), { role: 'user', parts: [{ text: msg }] }];

  let reply = await gemini(system, contents, 0.3);
  if (reply && !langOk(lang, reply)) { const again = await gemini(system, contents, 0.1); if (again && (langOk(lang, again) || !langOk(lang, reply))) reply = again; }
  if ((lang === 'ko' || lang === 'en') && /\p{Script=Han}/u.test(reply)) reply = reply.replace(/\p{Script=Han}+[\p{P}]*/gu, '').trim();
  reply = reply.replace(/[*#`]+/g, '').trim().slice(0, 1000)
    || say('지금은 답변을 드리기 어려워요. 문의폼으로 남겨 주시면 빠르게 연락드리겠습니다.', "Sorry, I can't answer right now. Please leave a message through the inquiry form.");

  await sb.from('chat_messages').insert([
    { session_id: sess.id, catalog_id: cat.id, ip, role: 'user', content: msg },
    { session_id: sess.id, catalog_id: cat.id, ip, role: 'ai', content: reply },
  ]);
  await sb.from('chat_sessions').update({ msg_count: sess.msg_count + 1, updated_at: new Date().toISOString() }).eq('id', sess.id);
  return json({ ok: true, reply });
});
