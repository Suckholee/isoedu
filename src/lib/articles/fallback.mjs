export const FALLBACK_ARTICLES = [
 {id:'224473222331',date:'2026-11-11',category:'ISO 준비',title:"거래처 요구를 받은 날 먼저 정할 '3가지'"},
 {id:'224470038591',date:'2026-11-09',category:'ISO 이해',title:'인증서가 있어도 불량이 나올 수 있는 이유'},
 {id:'224447142360',date:'2026-10-20',category:'준비와 심사',title:"컨설팅해 준 회사를 2년간 심사할 수 없는 '이유'"},
 {id:'224425309366',date:'2026-09-28',category:'사업계획·정책자금',title:'신청서에 v3가 붙기까지'},
 {id:'224360668675',date:'2026-07-28',category:'기업인증',title:'창업 3년 안에 짚어야 할 세제 정리'},
 {id:'224359633624',date:'2026-07-27',category:'정책자금',title:'운전자금과 시설자금 두 갈래로 정리'},
];
export const fallbackCards=FALLBACK_ARTICLES.map(a=>({...a,id:'blog-'+a.id,blogId:a.id,date:a.date+'T00:00:00+09:00',siteUrl:'https://honestone.kr/insights/'+a.id,blogUrl:'https://blog.naver.com/honest_stone/'+a.id,source:'blog',aiGenerated:false}));
