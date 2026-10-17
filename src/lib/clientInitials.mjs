export const CLIENT_INITIALS=['전체','ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','영문','숫자/기타'];
export function clientSortName(name){return String(name||'').normalize('NFKC').replace(/^\s*(?:(?:\(\s*주\s*\)|\(\s*유\s*\)|주식회사|유한회사|유한책임회사|사단법인|재단법인)\s*)+/u,'').trim();}
export function clientInitial(name){const first=clientSortName(name).charAt(0),code=first.charCodeAt(0);if(code>=0xac00&&code<=0xd7a3)return ['ㄱ','ㄱ','ㄴ','ㄷ','ㄷ','ㄹ','ㅁ','ㅂ','ㅂ','ㅅ','ㅅ','ㅇ','ㅈ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'][Math.floor((code-0xac00)/588)];return /[a-z]/i.test(first)?'영문':'숫자/기타';}
