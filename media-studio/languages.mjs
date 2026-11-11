// Scoring Heroes global language registry v1.
// BCP 47 codes; registry is extensible, not an assertion of full translation/TTS support.
export const DEFAULT_LANGUAGE='en';
const raw=[
['en','English','English','ltr'],['te','Telugu','తెలుగు','ltr'],['hi','Hindi','हिन्दी','ltr'],
['ta','Tamil','தமிழ்','ltr'],['kn','Kannada','ಕನ್ನಡ','ltr'],['ml','Malayalam','മലയാളം','ltr'],
['bn','Bengali','বাংলা','ltr'],['mr','Marathi','मराठी','ltr'],['gu','Gujarati','ગુજરાતી','ltr'],
['pa','Punjabi','ਪੰਜਾਬੀ','ltr'],['or','Odia','ଓଡ଼ିଆ','ltr'],['as','Assamese','অসমীয়া','ltr'],
['ur','Urdu','اردو','rtl'],['ne','Nepali','नेपाली','ltr'],['si','Sinhala','සිංහල','ltr'],
['ar','Arabic','العربية','rtl'],['fa','Persian','فارسی','rtl'],['he','Hebrew','עברית','rtl'],
['ps','Pashto','پښتو','rtl'],['sd','Sindhi','سنڌي','rtl'],['dv','Dhivehi','ދިވެހި','rtl'],
['es','Spanish','Español','ltr'],['pt','Portuguese','Português','ltr'],['fr','French','Français','ltr'],
['de','German','Deutsch','ltr'],['it','Italian','Italiano','ltr'],['nl','Dutch','Nederlands','ltr'],
['ru','Russian','Русский','ltr'],['uk','Ukrainian','Українська','ltr'],['pl','Polish','Polski','ltr'],
['tr','Turkish','Türkçe','ltr'],['el','Greek','Ελληνικά','ltr'],['ro','Romanian','Română','ltr'],
['cs','Czech','Čeština','ltr'],['sk','Slovak','Slovenčina','ltr'],['hu','Hungarian','Magyar','ltr'],
['sv','Swedish','Svenska','ltr'],['da','Danish','Dansk','ltr'],['no','Norwegian','Norsk','ltr'],
['fi','Finnish','Suomi','ltr'],['is','Icelandic','Íslenska','ltr'],['bg','Bulgarian','Български','ltr'],
['sr','Serbian','Српски','ltr'],['hr','Croatian','Hrvatski','ltr'],['sl','Slovenian','Slovenščina','ltr'],
['sq','Albanian','Shqip','ltr'],['hy','Armenian','Հայերեն','ltr'],['ka','Georgian','ქართული','ltr'],
['az','Azerbaijani','Azərbaycanca','ltr'],['kk','Kazakh','Қазақша','ltr'],['uz','Uzbek','Oʻzbekcha','ltr'],
['zh','Chinese','中文','ltr'],['ja','Japanese','日本語','ltr'],['ko','Korean','한국어','ltr'],
['th','Thai','ไทย','ltr'],['vi','Vietnamese','Tiếng Việt','ltr'],['id','Indonesian','Bahasa Indonesia','ltr'],
['ms','Malay','Bahasa Melayu','ltr'],['fil','Filipino','Filipino','ltr'],['my','Burmese','မြန်မာ','ltr'],
['km','Khmer','ខ្មែរ','ltr'],['lo','Lao','ລາວ','ltr'],['mn','Mongolian','Монгол','ltr'],
['sw','Swahili','Kiswahili','ltr'],['am','Amharic','አማርኛ','ltr'],['ha','Hausa','Hausa','ltr'],
['yo','Yoruba','Yorùbá','ltr'],['ig','Igbo','Igbo','ltr'],['zu','Zulu','isiZulu','ltr'],
['xh','Xhosa','isiXhosa','ltr'],['af','Afrikaans','Afrikaans','ltr'],['so','Somali','Soomaali','ltr'],
['om','Oromo','Afaan Oromoo','ltr'],['rw','Kinyarwanda','Ikinyarwanda','ltr'],
['st','Sesotho','Sesotho','ltr'],['tn','Setswana','Setswana','ltr'],
['ht','Haitian Creole','Kreyòl ayisyen','ltr'],['qu','Quechua','Runasimi','ltr'],
['eu','Basque','Euskara','ltr'],['ca','Catalan','Català','ltr'],['gl','Galician','Galego','ltr'],
['cy','Welsh','Cymraeg','ltr'],['ga','Irish','Gaeilge','ltr'],['mt','Maltese','Malti','ltr']
];
export const LANGUAGES=Object.freeze(raw.map(([code,name,nativeName,direction])=>Object.freeze({
 code,name,nativeName,direction,
 articleReady:['en','te','hi'].includes(code),voiceReady:false
})));
const indexed=new Map(LANGUAGES.map(x=>[x.code,x]));
export function resolveLanguage(value){
 let requested=String(value||DEFAULT_LANGUAGE).trim().replace(/_/g,'-').slice(0,35);
 try{requested=Intl.getCanonicalLocales(requested)[0]||DEFAULT_LANGUAGE}catch{requested=DEFAULT_LANGUAGE}
 const base=requested.toLowerCase().split('-')[0],entry=indexed.get(base);
 return {requested,code:entry?.code||DEFAULT_LANGUAGE,base:entry?.code||DEFAULT_LANGUAGE,
  direction:entry?.direction||'ltr',supported:!!entry,
  articleLanguage:entry?.articleReady?entry.code:DEFAULT_LANGUAGE,
  translationAvailable:!!entry?.articleReady,voiceAvailable:false,
  fallback:entry?.articleReady?null:DEFAULT_LANGUAGE};
}
export function languageCatalog(){return {defaultLanguage:DEFAULT_LANGUAGE,languages:LANGUAGES,
 note:'Catalog entries do not imply that articles, UI translations or voice are ready. Unavailable content falls back to English.'}}
