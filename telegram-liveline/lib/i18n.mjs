// Bot labels per language. Match data (names, status, commentary) stays as the provider sends it (English).
const S = {
  en: {
    welcome: '🏏 <b>SH Sports Live Line</b>\nFastest ball-by-ball cricket score for every match worldwide.\n\nTap <b>Live matches</b>, pick a match, and the score updates by itself every ball. Fours, sixes, wickets and milestones come as alerts.',
    liveBtn: '🔴 Live matches', upBtn: '🗓 Upcoming', langBtn: '🌐 Language', helpBtn: '❓ Help',
    men: "🏏 Men's", women: "🏏 Women's", noLive: 'No live matches right now. Check Upcoming.', noUp: 'No upcoming matches listed.',
    pick: 'Pick a match to follow:', upcoming: '🗓 <b>Upcoming matches</b>',
    following: '✅ Following this match. This card updates by itself.', stopped: '⏹ Stopped. Send /live to follow another match.',
    refresh: '🔄 Refresh', card: '📋 Scorecard', stop: '⏹ Stop', other: '🔴 Other matches',
    live: 'LIVE', need: 'Need {r} runs from {b} balls', win: 'Win % (model)', projected: 'Projected (CRR / +1 / +2)',
    partnership: 'Partnership', last6: 'Last balls', thisOver: 'This over', noScore: 'Match yet to start.', noCard: 'Scorecard not available yet.',
    four: 'FOUR!', six: 'SIX!', wicket: 'WICKET!', fifty: 'reaches {mark}!', innings: 'Innings break', result: '🏆 Result',
    overDone: 'End of over {n}: {r} runs', langPick: 'Choose your language:', langSet: 'Language set to English.',
    unavailable: 'Live data is not reachable right now. Try again in a minute.',
    help: '<b>Commands</b>\n/live - live matches\n/upcoming - upcoming matches\n/stop - stop following\n/language - change language\n\nOne live card per match keeps updating, so your chat is not flooded.',
  },
  hi: {
    welcome: '🏏 <b>SH Sports Live Line</b>\nदुनिया के हर मैच का सबसे तेज़ बॉल-बाय-बॉल स्कोर।\n\n<b>लाइव मैच</b> दबाएँ, मैच चुनें, स्कोर हर गेंद पर अपने आप बदलेगा। चौके, छक्के, विकेट और माइलस्टोन अलर्ट में आएँगे।',
    liveBtn: '🔴 लाइव मैच', upBtn: '🗓 आने वाले', langBtn: '🌐 भाषा', helpBtn: '❓ मदद',
    men: '🏏 पुरुष', women: '🏏 महिला', noLive: 'अभी कोई लाइव मैच नहीं। आने वाले मैच देखें।', noUp: 'कोई आने वाला मैच नहीं।',
    pick: 'फ़ॉलो करने के लिए मैच चुनें:', upcoming: '🗓 <b>आने वाले मैच</b>',
    following: '✅ यह मैच फ़ॉलो हो रहा है। कार्ड अपने आप अपडेट होगा।', stopped: '⏹ बंद किया। दूसरा मैच देखने के लिए /live भेजें।',
    refresh: '🔄 रिफ़्रेश', card: '📋 स्कोरकार्ड', stop: '⏹ बंद', other: '🔴 दूसरे मैच',
    live: 'लाइव', need: '{b} गेंदों में {r} रन चाहिए', win: 'जीत % (मॉडल)', projected: 'अनुमानित (CRR / +1 / +2)',
    partnership: 'साझेदारी', last6: 'पिछली गेंदें', thisOver: 'यह ओवर', noScore: 'मैच अभी शुरू नहीं हुआ।', noCard: 'स्कोरकार्ड अभी उपलब्ध नहीं।',
    four: 'चौका!', six: 'छक्का!', wicket: 'विकेट!', fifty: '{mark} पूरे!', innings: 'पारी ब्रेक', result: '🏆 नतीजा',
    overDone: 'ओवर {n} समाप्त: {r} रन', langPick: 'अपनी भाषा चुनें:', langSet: 'भाषा हिन्दी कर दी गई।',
    unavailable: 'लाइव डेटा अभी नहीं मिल रहा। एक मिनट बाद कोशिश करें।',
    help: '<b>कमांड</b>\n/live - लाइव मैच\n/upcoming - आने वाले मैच\n/stop - फ़ॉलो बंद\n/language - भाषा बदलें',
  },
  te: {
    welcome: '🏏 <b>SH Sports Live Line</b>\nప్రపంచంలో ప్రతి మ్యాచ్‌కి అత్యంత వేగమైన బాల్-బై-బాల్ స్కోర్.\n\n<b>లైవ్ మ్యాచ్‌లు</b> నొక్కి మ్యాచ్ ఎంచుకోండి, ప్రతి బంతికి స్కోర్ దానంతట అదే మారుతుంది. ఫోర్లు, సిక్స్‌లు, వికెట్లు, మైలురాళ్లు అలర్ట్‌గా వస్తాయి.',
    liveBtn: '🔴 లైవ్ మ్యాచ్‌లు', upBtn: '🗓 రాబోయేవి', langBtn: '🌐 భాష', helpBtn: '❓ సహాయం',
    men: '🏏 పురుషులు', women: '🏏 మహిళలు', noLive: 'ప్రస్తుతం లైవ్ మ్యాచ్‌లు లేవు. రాబోయేవి చూడండి.', noUp: 'రాబోయే మ్యాచ్‌లు లేవు.',
    pick: 'ఫాలో చేయడానికి మ్యాచ్ ఎంచుకోండి:', upcoming: '🗓 <b>రాబోయే మ్యాచ్‌లు</b>',
    following: '✅ ఈ మ్యాచ్ ఫాలో అవుతోంది. కార్డ్ దానంతట అదే అప్‌డేట్ అవుతుంది.', stopped: '⏹ ఆపేశాం. ఇంకో మ్యాచ్ కోసం /live పంపండి.',
    refresh: '🔄 రిఫ్రెష్', card: '📋 స్కోర్‌కార్డ్', stop: '⏹ ఆపు', other: '🔴 ఇతర మ్యాచ్‌లు',
    live: 'లైవ్', need: '{b} బంతుల్లో {r} పరుగులు కావాలి', win: 'గెలుపు % (మోడల్)', projected: 'అంచనా (CRR / +1 / +2)',
    partnership: 'భాగస్వామ్యం', last6: 'చివరి బంతులు', thisOver: 'ఈ ఓవర్', noScore: 'మ్యాచ్ ఇంకా మొదలవలేదు.', noCard: 'స్కోర్‌కార్డ్ ఇంకా అందుబాటులో లేదు.',
    four: 'ఫోర్!', six: 'సిక్స్!', wicket: 'వికెట్!', fifty: '{mark} పూర్తి!', innings: 'ఇన్నింగ్స్ బ్రేక్', result: '🏆 ఫలితం',
    overDone: 'ఓవర్ {n} ముగిసింది: {r} పరుగులు', langPick: 'మీ భాష ఎంచుకోండి:', langSet: 'భాష తెలుగుకి మార్చాం.',
    unavailable: 'లైవ్ డేటా ఇప్పుడు అందడం లేదు. ఒక నిమిషం తర్వాత ప్రయత్నించండి.',
    help: '<b>కమాండ్‌లు</b>\n/live - లైవ్ మ్యాచ్‌లు\n/upcoming - రాబోయే మ్యాచ్‌లు\n/stop - ఫాలో ఆపు\n/language - భాష మార్చు',
  },
};
export const LANGS = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు' };
export function tr(lang) {
  const d = S[lang] || S.en;
  return (key, vars = {}) => String(d[key] ?? S.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export function guessLang(code) {
  const c = String(code || '').slice(0, 2).toLowerCase();
  return S[c] ? c : 'en';
}
