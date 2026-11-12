import {OFFICIAL_FORMS} from './officialFormData.mjs';
import {PlanError} from './model.mjs';
export {OFFICIAL_FORMS};
export const FORM_KIND_LABELS = {'official-form':'공식 빈 양식','official-online-fields':'공식 온라인 입력 항목','guide-outline':'공식 안내 기반 구성','video-script':'현장 촬영 대본 도우미'};
export const FORM_COVERAGE = [
  {
    "type": "venture",
    "status": "guidance-ready",
    "note": "혁신성장·연구개발·예비벤처는 공식 구성 안내로 초안을 작성합니다. 벤처투자유형은 제출 증빙 확인이 중심이며 다른 유형의 계획서를 자동 적용하지 않습니다.",
    "sourceUrl": "https://www.smes.go.kr/venturein/board/viewArchBoard?menuId=4080000&bbsSn=5861",
    "readyCount": 3,
    "pending": []
  },
  {
    "type": "startup",
    "status": "partial",
    "note": "예비·초기 일반형, 초기 딥테크, 사내벤처, 장애인 창업사업화 양식을 연결했습니다. 투자연계형은 운영기관별 원문이 필요합니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000123430",
    "readyCount": 5,
    "pending": [
      {
        "type": "startup",
        "title": "창업도시 투자연계형 · 초기",
        "reason": "통합 공고에는 기업용 양식이 없습니다. 해당 도시 운영기관의 별첨 원문이 필요합니다.",
        "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000123430"
      }
    ]
  },
  {
    "type": "scaleup",
    "status": "partial",
    "note": "일반형·딥테크형 원문을 연결했습니다. 투자연계형·지역창업패키지는 별도 공고 양식을 사용해야 합니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000117820",
    "readyCount": 2,
    "pending": [
      {
        "type": "scaleup",
        "title": "창업도시 투자연계형 · 도약 / 지역창업패키지",
        "reason": "운영기관용 모집 양식과 기업 신청용 양식은 다릅니다. 해당 도시의 기업용 별첨을 보관해 선택하세요.",
        "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000123430"
      }
    ]
  },
  {
    "type": "restart",
    "status": "scoped-ready",
    "note": "2026 본예산·추경을 구분해 연결했습니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000120987",
    "readyCount": 2,
    "pending": []
  },
  {
    "type": "data",
    "status": "scoped-ready",
    "note": "2026 수요기업 양식을 연결했습니다. 공급기업 신청과 구분합니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000119210",
    "readyCount": 1,
    "pending": []
  },
  {
    "type": "export",
    "status": "partial",
    "note": "중기부 1차 양식 연결. 3차는 신청 시스템에서 제공하는 양식, 산업부 사업은 온라인 입력 항목을 별도로 확인해야 합니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000124119",
    "readyCount": 1,
    "pending": [
      {
        "type": "export",
        "title": "중기부 수출바우처 · 2026 3차",
        "reason": "공고 8쪽: 온라인 신청 시스템에서 양식을 내려받아 작성·날인해야 합니다. 1차 양식으로 대체하지 않습니다.",
        "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000124119"
      },
      {
        "type": "export",
        "title": "산업부 수출바우처 · 일반 / 긴급",
        "reason": "사업계획서를 홈페이지 안에서 작성합니다. 실제 신청 화면 항목을 확보한 뒤 연결해야 합니다.",
        "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000116978"
      }
    ]
  },
  {
    "type": "rnd",
    "status": "partial",
    "note": "디딤돌 3차 일반·글로벌, 프리팁스 2차, 글로벌팁스 사업화, 인천 IP나래를 연결했습니다. TIPS R&D 및 다른 지역 IP나래와 구분합니다.",
    "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000124377",
    "readyCount": 5,
    "pending": [
      {
        "type": "rnd",
        "title": "TIPS · 연구개발",
        "reason": "공개 지원계획 공고와 연구개발계획서 서식은 다릅니다. 해당 세부과제의 신청 양식이 필요합니다.",
        "sourceUrl": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000117859"
      }
    ]
  },
  {
    "type": "finance",
    "status": "partial",
    "note": "기보 2억원 이하·초과, IP패스트·문화산업 양식을 연결했습니다. 신보·중진공·지역자금에는 해당 기관의 양식이 필요합니다.",
    "sourceUrl": "https://www.kibo.or.kr/dbranch/fomt/fomt01/warrantyAppForm.do",
    "readyCount": 4,
    "pending": [
      {
        "type": "finance",
        "title": "신용보증기금 · 창업보증",
        "reason": "보관 빈 양식은 선택할 수 있지만 현행 공식 판본 대조가 남았습니다. 기보 양식과 구분하세요.",
        "sourceUrl": "https://www.kodit.or.kr/kodit/na/ntt/selectNttList.do?bbsId=265&mi=2623"
      },
      {
        "type": "finance",
        "title": "중진공 · 정책자금",
        "reason": "디지털 융자신청서의 실제 항목이 필요합니다. 융자계획 공고를 신청 양식으로 사용하지 않습니다.",
        "sourceUrl": "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI003M0.do"
      },
      {
        "type": "finance",
        "title": "경기도 · 중소기업육성자금",
        "reason": "공식 자료실이 접근 권한을 요구합니다. 신청 계정에서 내려받은 현행 양식을 보관해 선택하세요.",
        "sourceUrl": "https://g-money.gg.go.kr/main.htm"
      }
    ]
  },
  {
    "type": "employment",
    "status": "scoped-ready",
    "note": "고용24 유연근무 장려금·일생활균형 인프라 참여신청 및 사업계획서를 연결했습니다. 그 밖의 고용지원 유형은 별도 양식이 필요합니다.",
    "sourceUrl": "https://www.work24.go.kr/cm/c/b/1100/selectBbttInfo.do?polySvcFomtId=FM00001562",
    "readyCount": 2,
    "pending": []
  },
  {
    "type": "small",
    "status": "scoped-ready",
    "note": "로컬기업·강한소상공인 로컬/혁신 양식과 소공인 스마트제조 온라인 항목·현장 촬영 대본을 연결했습니다.",
    "sourceUrl": "https://w-startup.daegu.go.kr/business/296?page=1",
    "readyCount": 5,
    "pending": []
  },
  {
    "type": "other",
    "status": "needs-selection",
    "note": "기타 사업은 신청 공고를 정한 뒤 회사 문서함에 보관한 해당 양식을 선택합니다. 임의의 공통 양식을 공식 양식으로 적용하지 않습니다.",
    "sourceUrl": null,
    "readyCount": 0,
    "pending": []
  }
];
export const getOfficialForm=id=>OFFICIAL_FORMS.find(f=>f.id===id)||null;
export function verifyOfficialForm(input){
 const form=getOfficialForm(input.template.id);if(!form)return null;
 if(form.type!==input.type)throw new PlanError('양식과 신청 사업이 다릅니다. 다시 선택해 주세요.');
 if(form.updatedAt!==input.template.updatedAt||form.text!==input.template.text)throw new PlanError('공식 양식이 변경됐습니다. 원문을 다시 읽어 주세요.',409);
 return form;
}
