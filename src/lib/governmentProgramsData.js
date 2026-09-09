// ========================================================
// Government & Local Government Overseas Certification Support Programs Master (53 Programs)
// IV. 정부 해외인증 지원사업 (26개 부처 사업)
// V. 지자체 해외인증 지원사업 (27개 시·도 사업)
// ========================================================

export const GOV_CENTRAL_PROGRAMS = [
  {
    id: 'GOV-C-01',
    category: 'CENTRAL',
    ministry: '산업통상자원부',
    title: '(산업통상자원부) 해외인증 전주기 맞춤자문 지원',
    budgetLimit: '기업당 최대 3,000만원 지원 (자부담 30%)',
    targetIndustry: '수출 유망 중소·중견 제조기업 전 분야',
    pageRef: 24,
    description: '해외 규격 분석부터 시험·인증기관 매칭, 기술문서(TCF) 작성, 현장심사 대응까지 1:1 맞춤형 전주기 컨설팅 제공',
    tags: ['산자부', '전주기자문', 'TCF', '시험인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-02',
    category: 'CENTRAL',
    ministry: '산업통상자원부 / 중소벤처기업부',
    title: '(산업통상자원부/중소벤처기업부) 수출지원기반활용사업 (수출바우처)',
    budgetLimit: '기업당 3,000만원 ~ 최대 1억원 바우처 지급',
    targetIndustry: '수출 실적 보유 또는 수출 희망 중소·중견기업',
    pageRef: 25,
    description: '해외규격인증, 디자인개발, 해외마케팅, 특허출원 등 14대 수출 지원 서비스를 바우처 메뉴판에서 자유롭게 선택 이용',
    tags: ['중기부', '산자부', '수출바우처', '자유선택', '인기사업'],
    requiredDocsTemplate: 'EXPORT_VOUCHER'
  },
  {
    id: 'GOV-C-03',
    category: 'CENTRAL',
    ministry: '중소벤처기업부',
    title: '(중소벤처기업부) 해외규격인증획득지원사업',
    budgetLimit: '기업당 연간 최대 1억원 (인증 건당 최대 5,000만원)',
    targetIndustry: '수출 500만불 미만 중소기업',
    pageRef: 26,
    description: 'CE, FDA, UL, CCC 등 545개 해외규격인증 획득에 소요되는 시험비, 심사비, 컨설팅비의 50~70% 직접 지원',
    tags: ['중기부', '해외규격인증', 'CE', 'FDA', 'UL', '직접지원'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-04',
    category: 'CENTRAL',
    ministry: '산업통상자원부',
    title: '(산업통상자원부) 비관세장벽 대응 지원사업',
    budgetLimit: '기업당 최대 2,500만원',
    targetIndustry: '해외 TBT(무역기술장벽) 규제 애로 기업',
    pageRef: 27,
    description: '해외 기술규제 및 비관세장벽 애로 해소를 위한 기술컨설팅, 시험분석, 인증대응 지원',
    tags: ['산자부', 'TBT', '비관세장벽', '무역규제'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-05',
    category: 'CENTRAL',
    ministry: '산업통상자원부',
    title: '(산업통상자원부) 로봇분야 해외인증획득비용 지원사업',
    budgetLimit: '기업당 최대 4,000만원',
    targetIndustry: '지능형 로봇 및 자동화 기기 제조기업',
    pageRef: 28,
    description: '서비스로봇, 협동로봇의 해외 안전규격(ISO 10218, CE MD, UL) 인증 시험 및 심사비 지원',
    tags: ['산자부', '로봇', '스마트제조', 'ISO10218'],
    requiredDocsTemplate: 'TECH_ROBOT_CERT'
  },
  {
    id: 'GOV-C-06',
    category: 'CENTRAL',
    ministry: '산업통상자원부',
    title: '(산업통상자원부) 국내 의료기기 사업화 촉진 사업',
    budgetLimit: '기업당 최대 5,000만원',
    targetIndustry: '의료기기 제조 및 바이오 헬스케어 기업',
    pageRef: 29,
    description: '국내 의료기기 기업의 해외 인허가(CE MDR, FDA 510(k)) 획득 및 사용적합성 평가 지원',
    tags: ['산자부', '의료기기', 'ISO13485', 'CE_MDR'],
    requiredDocsTemplate: 'BIO_HEALTH_CERT'
  },
  {
    id: 'GOV-C-07',
    category: 'CENTRAL',
    ministry: '산업통상자원부',
    title: '(산업통상자원부) 신재생설비 해외인증획득 지원사업',
    budgetLimit: '기업당 최대 5,000만원',
    targetIndustry: '태양광, 풍력, 수소 등 신재생에너지 부품 제조사',
    pageRef: 30,
    description: '신재생에너지 설비 및 핵심 부품의 해외 성능평가 및 국제규격(IEC 등) 인증 비용 지원',
    tags: ['산자부', '신재생', 'IEC', '친환경'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-08',
    category: 'CENTRAL',
    ministry: '과학기술정보통신부',
    title: '(과학기술정보통신부) 정보보호(정보보안·물리보안) 기업 해외인증획득 지원사업',
    budgetLimit: '기업당 최대 3,500만원',
    targetIndustry: '정보보안, 네트워크보안, CCTV 등 물리보안 기업',
    pageRef: 31,
    description: 'ISO/IEC 27001, CC인증, FIPS 등 정보보호 제품의 글로벌 보안인증 획득 소요비용 지원',
    tags: ['과기정통부', 'ISO27001', 'CC인증', '정보보안'],
    requiredDocsTemplate: 'IT_SECURITY_CERT'
  },
  {
    id: 'GOV-C-09',
    category: 'CENTRAL',
    ministry: '국토교통부',
    title: '(국토교통부) 해외철도 수주지원사업',
    budgetLimit: '기업당 최대 6,000만원',
    targetIndustry: '철도 차량, 신호, 궤도 부품 중소·중견기업',
    pageRef: 32,
    description: '국제철도안전규격(IRIS, SIL) 인증 및 시험성적서 발급비용 보조',
    tags: ['국토부', '철도', 'IRIS', 'SIL'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-10',
    category: 'CENTRAL',
    ministry: '농림축산식품부',
    title: '(농림축산부) 농기자재 수출기업 육성사업',
    budgetLimit: '기업당 최대 3,000만원',
    targetIndustry: '농기계, 비료, 농약, 시설자재 수출기업',
    pageRef: 33,
    description: '수출 대상국별 안전기준(OECD 규격, CE 등) 적합성 검정 및 인증 지원',
    tags: ['농림부', '농기자재', 'OECD규격'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-11',
    category: 'CENTRAL',
    ministry: '농림축산식품부',
    title: '(농림축산부) 해외인증등록지원사업 (한국식품연구원)',
    budgetLimit: '기업당 최대 2,000만원',
    targetIndustry: '가공식품 수출 중소제조기업',
    pageRef: 34,
    description: '할랄(HALAL), 코셔(KOSHER), 비건, FSSC 22000 등 국제 식품인증 등록비용 지원',
    tags: ['농림부', '할랄', '코셔', 'FSSC22000', '식품연구원'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  },
  {
    id: 'GOV-C-12',
    category: 'CENTRAL',
    ministry: '농림축산식품부',
    title: '(농림축산부) 해외인증등록지원사업 (한국농수산식품유통공사 aT)',
    budgetLimit: '기업당 최대 2,000만원 (80% 보조)',
    targetIndustry: '농식품 생산·수출업체',
    pageRef: 35,
    description: 'ISO 22000, HACCP, FDA 식품시설등록, Global GAP 등 해외 농식품 인증 실비 지원',
    tags: ['aT', 'ISO22000', 'HACCP', 'FDA시설등록'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  },
  {
    id: 'GOV-C-13',
    category: 'CENTRAL',
    ministry: '문화체육관광부',
    title: '(문화체육관광부) 스포츠용품 해외인증 획득지원 사업',
    budgetLimit: '기업당 최대 2,500만원',
    targetIndustry: '스포츠용품, 운동기구, 아웃도어 제조사',
    pageRef: 36,
    description: '국제경기연맹(FIFA, FIBA 등) 공인 및 해외 안전규격(CE, ASTM) 인증 지원',
    tags: ['문체부', '스포츠', '국제공인', 'CE'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-14',
    category: 'CENTRAL',
    ministry: '보건복지부',
    title: '(보건복지부) 의료기기기업 시장 진입 지원사업',
    budgetLimit: '기업당 최대 5,000만원',
    targetIndustry: '의료기기 혁신형 중소기업',
    pageRef: 37,
    description: '임상시험 설계, 생물학적 안전성 평가, 선진국 인허가 맞춤 컨설팅',
    tags: ['복지부', '의료기기', '임상시험', 'ISO13485'],
    requiredDocsTemplate: 'BIO_HEALTH_CERT'
  },
  {
    id: 'GOV-C-15',
    category: 'CENTRAL',
    ministry: '보건복지부',
    title: '(보건복지부) 의료기기 국제인증지원센터 사업',
    budgetLimit: '기업당 최대 1억원 (심화 트랙)',
    targetIndustry: '글로벌 진출 의료기기 제조업체',
    pageRef: 38,
    description: '유럽 MDR 2017/745 인증 전환 대응 및 기술문서 적합성 심층 검증',
    tags: ['복지부', 'MDR', 'CE', '국제인증지원센터'],
    requiredDocsTemplate: 'BIO_HEALTH_CERT'
  },
  {
    id: 'GOV-C-16',
    category: 'CENTRAL',
    ministry: '보건복지부',
    title: '(보건복지부) 의료기기 글로벌 판로개척 지원사업',
    budgetLimit: '기업당 최대 3,000만원',
    targetIndustry: '의료기기 수출 유망기업',
    pageRef: 40,
    description: '해외 국가별 품목허가 등록 및 현지 대리인 매칭 지원',
    tags: ['복지부', '품목허가', '글로벌판로'],
    requiredDocsTemplate: 'BIO_HEALTH_CERT'
  },
  {
    id: 'GOV-C-17',
    category: 'CENTRAL',
    ministry: '해양수산부',
    title: '(해양수산부) 해외 식품 규격인증 지원사업',
    budgetLimit: '기업당 최대 2,000만원',
    targetIndustry: '수산물 가공 및 수출업체',
    pageRef: 41,
    description: '수산물 MSC, ASC, 할랄, FDA 수산물 HACCP 등 국제 규격 인증 취득 지원',
    tags: ['해수부', '수산물', 'MSC', 'ASC', 'HACCP'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  },
  {
    id: 'GOV-C-18',
    category: 'CENTRAL',
    ministry: '해양수산부',
    title: '(해양수산부) 수산식품기업바우처 사업',
    budgetLimit: '기업당 최대 5,000만원 (바우처 방식)',
    targetIndustry: '유망 수산식품 가공·수출 기업',
    pageRef: 42,
    description: '수산식품 수출기업에 해외인증, 마케팅, 패키지 개선을 일괄 바우처로 지원',
    tags: ['해수부', '수산바우처', '패키지개선'],
    requiredDocsTemplate: 'EXPORT_VOUCHER'
  },
  {
    id: 'GOV-C-19',
    category: 'CENTRAL',
    ministry: '해양수산부',
    title: '(해양수산부) 수출 전략 인증 지원사업',
    budgetLimit: '기업당 최대 2,500만원',
    targetIndustry: '김, 참치, 굴 등 K-Seafood 주력 품목 수출사',
    pageRef: 44,
    description: '수출 대상국별 맞춤형 위생·품질 인증 및 영양성분 분석 검사 지원',
    tags: ['해수부', 'K-Seafood', '위생인증'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  },
  {
    id: 'GOV-C-20',
    category: 'CENTRAL',
    ministry: '환경부',
    title: '(환경부) 물산업 해외진출 지원사업',
    budgetLimit: '기업당 최대 4,000만원',
    targetIndustry: '수처리 장비, 필터, 상하수도 밸브 제조기업',
    pageRef: 45,
    description: '미국 NSF, WRAS, CE 등 수처리 및 음용수 안전 해외인증 획득 지원',
    tags: ['환경부', '물산업', 'NSF', 'WRAS'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-21',
    category: 'CENTRAL',
    ministry: '환경부',
    title: '(환경부) 우수 녹색산업 해외수출기업 지원사업',
    budgetLimit: '기업당 최대 5,000만원',
    targetIndustry: '녹색기술인증, 친환경 기자재 기업',
    pageRef: 46,
    description: '환경표지, 탄소발자국, RoHS, WEEE 등 글로벌 환경규격 적합성 인증 지원',
    tags: ['환경부', '녹색기술', '탄소발자국', 'RoHS'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-22',
    category: 'CENTRAL',
    ministry: '환경부',
    title: '(환경부) 친환경경영(ESG) 컨설팅 지원 사업',
    budgetLimit: '기업당 최대 3,000만원',
    targetIndustry: '공급망 ESG 평가 대응 중소기업',
    pageRef: 47,
    description: 'ISO 14001(환경), ISO 50001(에너지), EcoVadis 공급망 ESG 진단 및 개선 지원',
    tags: ['환경부', 'ISO14001', 'EcoVadis', 'ESG'],
    requiredDocsTemplate: 'ESG_MGMT_CERT'
  },
  {
    id: 'GOV-C-23',
    category: 'CENTRAL',
    ministry: '기상청',
    title: '(기상청) 기상기후산업 종합수출 지원사업',
    budgetLimit: '기업당 최대 2,000만원',
    targetIndustry: '기상관측 센서, 예보 소프트웨어 수출기업',
    pageRef: 48,
    description: '세계기상기구(WMO) 표준 적합성 검정 및 해외 필드테스트 인증 지원',
    tags: ['기상청', '기상기후', 'WMO', '센서인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-24',
    category: 'CENTRAL',
    ministry: '방위사업청',
    title: '(방위사업청) 유망수출품목발굴 지원사업',
    budgetLimit: '기업당 최대 6,000만원',
    targetIndustry: '방위산업 부품 및 국방 소프트웨어 협력업체',
    pageRef: 49,
    description: '미 국방규격(MIL-STD), AS9100(항공우주품질경영시스템) 인증 획득 지원',
    tags: ['방사청', 'MIL-STD', 'AS9100', '방산'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-25',
    category: 'CENTRAL',
    ministry: '산림청',
    title: '(산림청) 수출 임산물 글로벌경쟁력 강화사업(수출 임산물 해외인증 지원)',
    budgetLimit: '기업당 최대 2,000만원',
    targetIndustry: '목재, 목제품, 임산가공품 수출기업',
    pageRef: 50,
    description: '국제산림인증(FSC, PEFC), 합법목재 교역인증 등 친환경 산림인증 획득 지원',
    tags: ['산림청', 'FSC', 'PEFC', '임산물'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-C-26',
    category: 'CENTRAL',
    ministry: '농림축산식품부',
    title: '(농림축산부) 반려동물 연관산업 해외인증 등 현지화 지원사업',
    budgetLimit: '기업당 최대 2,500만원',
    targetIndustry: '펫푸드, 펫헬스케어, 펫테크 제조기업',
    pageRef: 51,
    description: '해외 AAFCO 사료기준, FDA 등록, 유기농 펫푸드 해외인증 및 성분분석 지원',
    tags: ['농림부', '반려동물', '펫푸드', 'AAFCO', 'FDA'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  }
];

export const GOV_LOCAL_PROGRAMS = [
  {
    id: 'GOV-L-01',
    category: 'LOCAL',
    region: '인천',
    title: '(인천) 해외규격인증획득 지원사업',
    budgetLimit: '기업당 최대 1,000만원 (80% 지원)',
    targetIndustry: '인천 소재 수출 중소제조기업',
    pageRef: 54,
    description: 'CE, FDA, RoHS, ISO 등 해외 규격 인증 및 갱신 소요 비용 지원',
    tags: ['인천시', '해외규격', '지자체보조'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-02',
    category: 'LOCAL',
    region: '인천',
    title: '(인천) 항공기업 인증획득 지원사업',
    budgetLimit: '기업당 최대 2,500만원',
    targetIndustry: '인천 소재 항공기 정비(MRO) 및 부품 제조사',
    pageRef: 55,
    description: 'AS9100(항공품질), FAA, EASA 등 항공 국제규격 인증 획득 비용 보조',
    tags: ['인천', '항공MRO', 'AS9100', 'FAA'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-03',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 경기도 해외규격인증획득지원사업',
    budgetLimit: '기업당 최대 1,500만원',
    targetIndustry: '경기도 본사 또는 공장 소재 중소기업',
    pageRef: 56,
    description: '전 세계 400여 개 제품인증 및 시스템인증 취득에 소요되는 심사·시험비 지원',
    tags: ['경기도', '경과원', '해외인증', '수출유망'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-04',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 섬유·패션 친환경 글로벌 인증 지원사업',
    budgetLimit: '기업당 최대 1,200만원',
    targetIndustry: '경기 북부 등 섬유, 염색, 의류 가공 중소기업',
    pageRef: 57,
    description: 'OEKO-TEX, GOTS, GRS 등 글로벌 친환경 섬유 인증 취득 지원',
    tags: ['경기도', '섬유패션', 'OEKO-TEX', 'GRS'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-05',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 국내·외 품질규격인증 획득지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '경기도 내 중소제조기업',
    pageRef: 58,
    description: 'KS, 신제품(NEP), 성능인증 및 해외규격 통합 품질인증 패키지 지원',
    tags: ['경기도', 'KS', '품질규격', '통합인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-06',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 성남시 해외규격인증획득 지원사업',
    budgetLimit: '기업당 최대 800만원',
    targetIndustry: '성남시 관내 IT, 바이오, 정밀기기 제조 중소기업',
    pageRef: 59,
    description: '수출 대상국 강제규격 인증 취득 소요비용 실비 지원',
    tags: ['성남시', '판교테크노', '해외규격'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-07',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 양주시 국내·외규격인증지원취득 지원사업',
    budgetLimit: '기업당 최대 700만원',
    targetIndustry: '양주시 소재 제조기업',
    pageRef: 60,
    description: '국내외 표준규격 인증 비용 및 시험분석 수수료 지원',
    tags: ['양주시', '제조기업', '시험분석'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-08',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) 중소기업 기술성장(통합인증)지원사업',
    budgetLimit: '기업당 최대 1,500만원',
    targetIndustry: '혁신형 기술개발 중소기업',
    pageRef: 61,
    description: '특허 기술의 사업화를 위한 제품 시험평가 및 복합 인증 패키지',
    tags: ['경기도', '기술성장', '특허사업화'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-09',
    category: 'LOCAL',
    region: '경기',
    title: '(경기) ESG 경영 및 탄소중립 인증 지원사업',
    budgetLimit: '기업당 최대 2,000만원',
    targetIndustry: '경기도 내 수출 주력 중소기업',
    pageRef: 62,
    description: 'ISO 14001, 탄소배출량 산정 및 제3자 검증, CBAM(탄소국경세) 대응 컨설팅',
    tags: ['경기도', 'CBAM', '탄소중립', 'ISO14001'],
    requiredDocsTemplate: 'ESG_MGMT_CERT'
  },
  {
    id: 'GOV-L-10',
    category: 'LOCAL',
    region: '강원',
    title: '(강원) 해외규격인증 획득 지원사업',
    budgetLimit: '기업당 최대 800만원',
    targetIndustry: '강원특별자치도 내 중소기업',
    pageRef: 63,
    description: '바이오, 식음료, 의료기기 분야 해외 규격인증비 지원',
    tags: ['강원도', '바이오', '식음료'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-11',
    category: 'LOCAL',
    region: '대전',
    title: '(대전) 해외규격인증획득지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '대전 소재 연구개발형 중소기업',
    pageRef: 64,
    description: '대덕연구개발특구 연계 첨단 기술제품의 글로벌 인증 지원',
    tags: ['대전시', '대덕특구', '첨단기술'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-12',
    category: 'LOCAL',
    region: '대전',
    title: '(대전) 해외진출 직접지원사업',
    budgetLimit: '기업당 최대 1,200만원',
    targetIndustry: '대전 내 수출 유망 스타트업',
    pageRef: 65,
    description: '수출 인큐베이팅, 현지 실증(PoC) 및 규제 인증 지원',
    tags: ['대전시', '스타트업', '해외PoC'],
    requiredDocsTemplate: 'EXPORT_VOUCHER'
  },
  {
    id: 'GOV-L-13',
    category: 'LOCAL',
    region: '세종',
    title: '(세종) 해외판로 지원사업',
    budgetLimit: '기업당 최대 800만원',
    targetIndustry: '세종특별자치시 관내 제조업',
    pageRef: 66,
    description: '수출 필수 인증 취득 및 해외 바이어 매칭 지원',
    tags: ['세종시', '판로개척', '해외인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-14',
    category: 'LOCAL',
    region: '충남',
    title: '(충남) 해외규격인증획득지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '충남 소재 자동차부품, 디스플레이, 화학 기업',
    pageRef: 67,
    description: '주력 산업군 해외 규격인증 및 사후관리 심사비용 지원',
    tags: ['충남도', '자동차부품', 'IATF16949'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-15',
    category: 'LOCAL',
    region: '충북',
    title: '(충북) 수출기업 해외규격인증 및 지재권 취득 지원 사업',
    budgetLimit: '기업당 최대 1,200만원',
    targetIndustry: '충북 소재 바이오, 이차전지, 반도체 기업',
    pageRef: 68,
    description: '해외 특허 출원과 해외 규격인증을 패키지로 연계 지원',
    tags: ['충북도', '이차전지', '지재권연계'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-16',
    category: 'LOCAL',
    region: '충북',
    title: '(충북) 화장품 수출컨설팅 지원사업',
    budgetLimit: '기업당 최대 1,500만원',
    targetIndustry: '오송 바이오밸리 등 충북 화장품·뷰티 제조사',
    pageRef: 69,
    description: '유럽 CPNP, 미국 MoCRA, 중국 NMPA 화장품 안전성 인허가 대행',
    tags: ['충북도', 'K-뷰티', 'MoCRA', 'CPNP'],
    requiredDocsTemplate: 'BIO_HEALTH_CERT'
  },
  {
    id: 'GOV-L-17',
    category: 'LOCAL',
    region: '전남',
    title: '(전남) 전남 농수산식품 세계 일류 상품화 지원사업',
    budgetLimit: '기업당 최대 1,500만원',
    targetIndustry: '전남 농수산 특산물 가공·수출 기업',
    pageRef: 70,
    description: '국제 식품인증, 패키징 현지화 및 글로벌 바이어 발굴',
    tags: ['전남도', '농수산특산물', 'K-푸드'],
    requiredDocsTemplate: 'FOOD_AGRI_CERT'
  },
  {
    id: 'GOV-L-18',
    category: 'LOCAL',
    region: '전남',
    title: '(전남) 공산품 중소기업 해외규격인증 지원사업',
    budgetLimit: '기업당 최대 800만원',
    targetIndustry: '전남 관내 일반 공산품 및 조선기자재 기업',
    pageRef: 71,
    description: '해외 바이어 요구 규격 및 선급 인증(DNV, KR 등) 취득비 지원',
    tags: ['전남도', '조선기자재', '선급인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-19',
    category: 'LOCAL',
    region: '전북',
    title: '(전북) 수출품 중국 현지화 지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '대중국 수출 희망 전북 중소기업',
    pageRef: 72,
    description: '중국 CCC인증, CFDA 위생허가, 라벨링 검사 및 현지 유통 연계',
    tags: ['전북도', '중국수출', 'CCC', 'CFDA'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-20',
    category: 'LOCAL',
    region: '전북',
    title: '(전북) 전북형 수출바우처 지원사업',
    budgetLimit: '기업당 최대 3,000만원 (바우처 방식)',
    targetIndustry: '전북 주력산업(스마트농생명, 전기차) 중소기업',
    pageRef: 73,
    description: '해외인증부터 통번역, 전시회 참가까지 자율 바우처 지원',
    tags: ['전북도', '수출바우처', '지역자율'],
    requiredDocsTemplate: 'EXPORT_VOUCHER'
  },
  {
    id: 'GOV-L-21',
    category: 'LOCAL',
    region: '전북',
    title: '(전북) 수출애로 해소 전문가 컨설팅 지원사업',
    budgetLimit: '기업당 전문가 자문 최대 10회 (전액 무료)',
    targetIndustry: '해외 통관 및 인증 애로 겪는 중소기업',
    pageRef: 74,
    description: '전문 관세사·ISO심사원 1:1 현장 방문 기술지도',
    tags: ['전북도', '전문가자문', '현장지도'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-22',
    category: 'LOCAL',
    region: '광주',
    title: '(광주) 해외규격인증 지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '광주 광산업, 가전, 미래차 부품 기업',
    pageRef: 75,
    description: '광학 및 전자기기 해외 안전규격(UL, CE, FCC) 인증 지원',
    tags: ['광주시', '광산업', 'UL', 'FCC'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-23',
    category: 'LOCAL',
    region: '부산',
    title: '(부산) 글로벌 규격인증 지재권 획득 지원사업',
    budgetLimit: '기업당 최대 1,500만원',
    targetIndustry: '부산 소재 해양, 수산, 기계부품 기업',
    pageRef: 76,
    description: 'PCT 국제특허 및 해외 제품규격 복합 인증 지원',
    tags: ['부산시', '지재권', '해외특허', '규격인증'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-24',
    category: 'LOCAL',
    region: '부산',
    title: '(부산) 중소기업 ISO 인증 지원사업',
    budgetLimit: '기업당 최대 400만원 (심사비 70% 지원)',
    targetIndustry: '부산 관내 5~20인 제조 및 지식서비스업',
    pageRef: 77,
    description: 'ISO 9001(품질), ISO 14001(환경), ISO 45001(안전) 신규 인증 취득비 지원',
    tags: ['부산시', 'ISO9001', 'ISO14001', '소기업특화'],
    requiredDocsTemplate: 'ISO_DIRECT_GRANT'
  },
  {
    id: 'GOV-L-25',
    category: 'LOCAL',
    region: '울산',
    title: '(울산) 중소기업 국제표준 인증 지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '울산 자동차, 조선, 석유화학 벤더 기업',
    pageRef: 78,
    description: '글로벌 대기업 납품 필수 국제표준 경영시스템 인증 및 갱신비 지원',
    tags: ['울산시', '국제표준', '글로벌공급망'],
    requiredDocsTemplate: 'ISO_DIRECT_GRANT'
  },
  {
    id: 'GOV-L-26',
    category: 'LOCAL',
    region: '경남',
    title: '(경남) 중소기업 해외인증 획득 지원사업',
    budgetLimit: '기업당 최대 1,200만원',
    targetIndustry: '경남 원전, 방산, 항공우주, 기계 제조사',
    pageRef: 79,
    description: 'ASME(원자력), AS9100(항공), CE 등 고난도 기술인증 심사비 지원',
    tags: ['경남도', 'ASME', '원전', '방산'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  },
  {
    id: 'GOV-L-27',
    category: 'LOCAL',
    region: '경북',
    title: '(경북) 경상북도 수출기업 해외규격인증 지원사업',
    budgetLimit: '기업당 최대 1,000만원',
    targetIndustry: '경북 전자, 소재, 첨단부품 중소기업',
    pageRef: 80,
    description: '수출 전략국 기술장벽 해소용 인증 취득 및 시험료 지원',
    tags: ['경북도', '전자부품', '소부장'],
    requiredDocsTemplate: 'STANDARD_OVERSEAS_CERT'
  }
];

export const ALL_GOV_PROGRAMS = [...GOV_CENTRAL_PROGRAMS, ...GOV_LOCAL_PROGRAMS];

// ========================================================
// Required Submission Documents Templates with Reuse Mapping Rules
// ========================================================
export const REQUIRED_DOCUMENTS_TEMPLATES = {
  // 1. 해외규격인증 획득 지원사업 표준 제출서류 (중기부, 지자체 공통)
  STANDARD_OVERSEAS_CERT: [
    {
      id: 'DOC-REQ-01',
      name: '지원사업 신청서 및 과업추진계획서',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 40점 (사업 타당성 및 수출 계획)',
      issuer: '주관기관 서식 / 기업 자체 작성',
      reuseSourceType: 'EXISTING_PSST_PLAN',
      matchedCategory: '04. 기록 / 양식 (Records)',
      matchKeywords: ['사업계획서', '추진계획', '과업계획', 'PSST', '신청서'],
      description: '인증 획득 목표, 추진 일정, 해외 시장 진출 계획을 포함한 정형 사업계획서'
    },
    {
      id: 'DOC-REQ-02',
      name: '사업자등록증명원 (최근 3개월 이내 발급)',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '국세청 홈택스',
      reuseSourceType: 'EXISTING_BIZ_REG',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['사업자등록', '사업자등록증'],
      description: '기업 기본 인적사항 및 개업연월일 확인'
    },
    {
      id: 'DOC-REQ-03',
      name: '최근 3개년 표준재무제표증명 (재무상태표·손익계산서)',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 20점 (재무 건전성 및 매출 성장세)',
      issuer: '국세청 홈택스 / 세무대리인',
      reuseSourceType: 'EXISTING_FINANCIAL_STMT',
      matchedCategory: '04. 기록 / 양식 (Records)',
      matchKeywords: ['재무제표', '손익계산서', '재무상태표', '결산'],
      description: '부채비율, 자본잠식 여부, 매출액 규모 심사'
    },
    {
      id: 'DOC-REQ-04',
      name: '4대 사회보험 사업장 가입자 명부',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '고용인원 확인 (5~20인 소기업 가점 대상)',
      issuer: '4대사회보험 정보연계센터',
      reuseSourceType: 'EXISTING_EMPLOYEE_LIST',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['4대보험', '가입자명부', '임직원', '취업규칙'],
      description: '상시 근로자수 산정 및 중소기업 규모 확인'
    },
    {
      id: 'DOC-REQ-05',
      name: '국세 및 지방세 납세증명서 (완납증명)',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '정부24 / 홈택스 / 위택스',
      reuseSourceType: 'GOV_ISSUE_FRESH',
      matchedCategory: null,
      matchKeywords: ['국세완납', '지방세완납', '납세증명'],
      description: '체납 사실이 없음을 입증하는 법정 서류 (유효기간 30일 이내)'
    },
    {
      id: 'DOC-REQ-06',
      name: '기존 보유 품질·경영인증서 사본 (가점 우대)',
      type: 'BONUS',
      isEvaluationTarget: true,
      points: '가점 3~5점 부여 (ISO 9001, 14001, 45001 등)',
      issuer: '공인 인증기관',
      reuseSourceType: 'EXISTING_ISO_CERT',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['ISO 9001', 'ISO 14001', 'ISO 45001', '인증서 사본', 'ISO_CERT'],
      description: '기존 ISO 품질/환경 인증 보유 시 심사 평가에서 3~5점 가점 직결'
    },
    {
      id: 'DOC-REQ-07',
      name: '사내 품질관리 프로세스 규정 또는 품질매뉴얼',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 15점 (사내 품질보증 수행 능력)',
      issuer: '사내 표준 QMS',
      reuseSourceType: 'EXISTING_QMS_MANUAL',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['품질 매뉴얼', 'QM-01', '조직상황', '품질방침', 'QMS'],
      description: '기업이 자체적인 품질경영시스템 규정을 갖추고 있는지 증빙'
    },
    {
      id: 'DOC-REQ-08',
      name: '인증 대상 제품 설명서 및 기술 사양서(스펙 시트)',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 15점 (기술성 및 인증 적합성)',
      issuer: '기업 자체 기술문서',
      reuseSourceType: 'EXISTING_TECH_SPEC',
      matchedCategory: '03. 지침서 (Instruction)',
      matchKeywords: ['제품설명서', '사양서', '카탈로그', '검사기준서', '지침서'],
      description: '해외 인증 대상 제품의 도면, 주요 부품목록, 기능 사양'
    },
    {
      id: 'DOC-REQ-09',
      name: '공인 시험기관 및 컨설팅사 견적서 (비교견적 포함)',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '시험인증원 / ISO 컨설팅사',
      reuseSourceType: 'NEW_VENDOR_QUOTATION',
      matchedCategory: null,
      matchKeywords: ['견적서', '비교견적', '소요예산'],
      description: '정부 지원금 산정의 근거가 되는 실비 견적서'
    },
    {
      id: 'DOC-REQ-10',
      name: '법인 정관 및 주주명부 사본',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '기업 보관 공증본',
      reuseSourceType: 'EXISTING_CORPORATE_DOCS',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['법인 정관', '주주명부', '정관'],
      description: '법인 설립 목적 및 대표이사/과점주주 현황 확인'
    }
  ],

  // 2. 수출바우처 사업 제출서류 (산자부/중기부)
  EXPORT_VOUCHER: [
    {
      id: 'DOC-VOUCHER-01',
      name: '수출바우처 사업신청서 및 글로벌 역량진단서',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 50점',
      issuer: '수출바우처 포털 양식',
      reuseSourceType: 'EXISTING_PSST_PLAN',
      matchedCategory: '04. 기록 / 양식 (Records)',
      matchKeywords: ['사업계획서', 'PSST', '역량진단'],
      description: '수출전략, 시장분석, 마케팅 계획서'
    },
    {
      id: 'DOC-VOUCHER-02',
      name: '직전년도 수출실적증명원 (한국무역협회 발급)',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '수출 트랙(내수/초보/유망/성장) 분류 기준',
      issuer: '한국무역협회 / 무역정보통신(KTNET)',
      reuseSourceType: 'GOV_ISSUE_FRESH',
      matchedCategory: null,
      matchKeywords: ['수출실적', '무역협회'],
      description: '직전년도 직수출 및 간접수출 실적 합산'
    },
    {
      id: 'DOC-VOUCHER-03',
      name: '기존 ISO 인증서 및 벤처/이노비즈 확인서 (가점 서류)',
      type: 'BONUS',
      isEvaluationTarget: true,
      points: '가점 최대 5점',
      issuer: '공인기관',
      reuseSourceType: 'EXISTING_ISO_CERT',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['ISO 9001', 'ISO 14001', '벤처기업', '연구소'],
      description: '품질경영 및 기술혁신 인증 가점'
    },
    {
      id: 'DOC-VOUCHER-04',
      name: '사업자등록증 및 3개년 재무제표',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      issuer: '국세청 홈택스',
      reuseSourceType: 'EXISTING_FINANCIAL_STMT',
      matchedCategory: '04. 기록 / 양식 (Records)',
      matchKeywords: ['재무제표', '사업자등록증'],
      description: '기업 건전성 심사'
    },
    {
      id: 'DOC-VOUCHER-05',
      name: '4대보험 가입자명부 및 국세/지방세 완납증명',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '정부24 / 연계센터',
      reuseSourceType: 'EXISTING_EMPLOYEE_LIST',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['4대보험', '국세완납'],
      description: '임직원수 및 체납 유무 검증'
    }
  ],

  // 3. 지자체 ISO 직접 인증 지원사업 (부산, 울산 등)
  ISO_DIRECT_GRANT: [
    {
      id: 'DOC-ISOGRANT-01',
      name: '지자체 ISO 인증 지원금 신청서',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '적격성 심사',
      issuer: '지자체 테크노파크 서식',
      reuseSourceType: 'EXISTING_PSST_PLAN',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['신청서', '인증신청서', '추진계획'],
      description: 'ISO 9001/14001 도입 목적 및 기대효과 기술'
    },
    {
      id: 'DOC-ISOGRANT-02',
      name: '사업자등록증 및 공장등록증명원 (해당 시)',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '관할 지자체 / 홈택스',
      reuseSourceType: 'EXISTING_BIZ_REG',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['사업자등록', '공장등록'],
      description: '관내 사업장 입주 여부 검증'
    },
    {
      id: 'DOC-ISOGRANT-03',
      name: '사내 표준화 추진계획 및 품질방침서',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 30점',
      issuer: '사내 표준 문서',
      reuseSourceType: 'EXISTING_QMS_MANUAL',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['품질 매뉴얼', '품질방침', '조직상황', 'QM-01'],
      description: '최고경영자 품질방침 및 표준화 추진 일정'
    },
    {
      id: 'DOC-ISOGRANT-04',
      name: '공인 인증기관 계약서 및 심사비 견적서',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: 'KAB 공인 인증기관',
      reuseSourceType: 'NEW_VENDOR_QUOTATION',
      matchedCategory: null,
      matchKeywords: ['견적서', '계약서'],
      description: '지원금 지급 대상 심사비 확정 증빙'
    },
    {
      id: 'DOC-ISOGRANT-05',
      name: '국세·지방세 완납증명서 및 4대보험 가입명부',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '공공기관 발급',
      reuseSourceType: 'EXISTING_EMPLOYEE_LIST',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['4대보험', '완납증명'],
      description: '소기업 적격 검증'
    }
  ],

  // 4. 바이오/의료기기 지원사업 (CE MDR, FDA)
  BIO_HEALTH_CERT: [
    {
      id: 'DOC-BIO-01',
      name: '의료기기 기술문서(TCF) 및 위험관리보고서(ISO 14971)',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 40점',
      issuer: '기업 R&D/품질팀',
      reuseSourceType: 'EXISTING_QMS_MANUAL',
      matchedCategory: '02. 절차서 (Procedure)',
      matchKeywords: ['ISO 13485', '위험관리', '의료기기', '절차서', 'TCF'],
      description: '의료기기 안전성 및 성능 입증 핵심 문서'
    },
    {
      id: 'DOC-BIO-02',
      name: 'ISO 13485 품질경영시스템 인증서 사본',
      type: 'BONUS',
      isEvaluationTarget: true,
      points: '필수 자격 또는 가점 5점',
      issuer: '공인인증기관',
      reuseSourceType: 'EXISTING_ISO_CERT',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['ISO 13485', '인증서', '의료기기'],
      description: '의료기기 QMS 보유 여부'
    },
    {
      id: 'DOC-BIO-03',
      name: '의료기기 제조(수입)업 허가증 사본',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '식품의약품안전처',
      reuseSourceType: 'GOV_ISSUE_FRESH',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['식약처', '제조업허가'],
      description: '식약처 공인 제조업 허가 확인'
    },
    {
      id: 'DOC-BIO-04',
      name: '사업계획서, 재무제표 및 사업자등록증',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      issuer: '기업 자체 및 홈택스',
      reuseSourceType: 'EXISTING_FINANCIAL_STMT',
      matchedCategory: '04. 기록 / 양식 (Records)',
      matchKeywords: ['사업계획서', '재무제표', '사업자등록증'],
      description: '기업 안정성 심사'
    }
  ],

  // 5. 환경/ESG 지원사업 (ISO 14001, 탄소중립)
  ESG_MGMT_CERT: [
    {
      id: 'DOC-ESG-01',
      name: '사내 환경방침서 및 환경측면평가서',
      type: 'MANDATORY',
      isEvaluationTarget: true,
      points: '배점 30점',
      issuer: '사내 환경경영 표준',
      reuseSourceType: 'EXISTING_QMS_MANUAL',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['ISO 14001', '환경방침', '환경영향', '측면평가', '매뉴얼'],
      description: 'ISO 14001 환경경영시스템 핵심 요구문서'
    },
    {
      id: 'DOC-ESG-02',
      name: '기존 ISO 9001 / ISO 14001 인증서 사본',
      type: 'BONUS',
      isEvaluationTarget: true,
      points: '가점 5점',
      issuer: '인증기관',
      reuseSourceType: 'EXISTING_ISO_CERT',
      matchedCategory: '00. 인증서 원본 (Certificates)',
      matchKeywords: ['ISO 14001', 'ISO 9001', '인증서'],
      description: '기존 경영시스템 구축 성숙도 증빙'
    },
    {
      id: 'DOC-ESG-03',
      name: '사업자등록증, 3개년 재무제표, 4대보험 명부',
      type: 'MANDATORY',
      isEvaluationTarget: false,
      issuer: '공공기관 발급',
      reuseSourceType: 'EXISTING_EMPLOYEE_LIST',
      matchedCategory: '01. 매뉴얼 (Manual)',
      matchKeywords: ['재무제표', '4대보험', '사업자등록증'],
      description: '기업 기본 요건 확인'
    }
  ]
};
