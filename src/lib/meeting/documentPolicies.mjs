// Generated from data/document-policies/notion-20261029.json; keep source parity test.
export const policyCatalog = {
  "version": "notion-2026-10-29-v1",
  "reviewedAt": "2026-10-29",
  "basis": "어니스톤 노션 운영 안내. 법정 요건·선정 가능 판정 아님. 기관 최신 요구와 충돌 시 재확인.",
  "types": {
    "ISO": {
      "label": "ISO 인증",
      "url": "https://honestone.notion.site/",
      "documents": [
        {
          "key": "iso-application",
          "title": "ISO 인증 신청서",
          "guidance": "251210 양식. 어려운 항목은 비워 두고 함께 작성합니다."
        },
        {
          "key": "business-registration",
          "title": "사업자등록증",
          "guidance": "현재 사업장·업종을 대조합니다."
        },
        {
          "key": "insurance-roster",
          "title": "4대보험 가입자 명부",
          "guidance": "실제 인원·대표자·외부·교대 인원 대조. 노션에 일수 제한 없음."
        },
        {
          "key": "permits",
          "title": "인허가 서류",
          "conditional": true,
          "guidance": "해당 업종의 허가증. 원문에 유효기간이 있으면 입력합니다."
        },
        {
          "key": "company-stamp",
          "title": "회사 명판·직인",
          "guidance": "법인은 법인/사용인감, 개인사업자는 개인도장."
        },
        {
          "key": "representative-signature",
          "title": "대표자 서명",
          "guidance": "A4에 서명 후 스캔·사진. 해당 신청 목적 확인."
        },
        {
          "key": "quality-signature",
          "title": "품질 담당자 서명"
        },
        {
          "key": "manual",
          "title": "회사 매뉴얼·절차서"
        },
        {
          "key": "improvement",
          "title": "개선보고서·실행 증빙",
          "conditional": true
        },
        {
          "key": "onsite-signature",
          "title": "현장 심사 서명 기록",
          "conditional": true
        }
      ]
    },
    "VENTURE_GROWTH": {
      "label": "벤처 · 혁신성장유형",
      "url": "https://honestone.notion.site/vc1",
      "documents": [
        {
          "key": "sme-certificate",
          "title": "중소기업확인서",
          "rule": {
            "kind": "expiry",
            "required": true
          },
          "guidance": "신청일 현재 유효한 확인서."
        },
        {
          "key": "business-registration",
          "title": "사업자등록증"
        },
        {
          "key": "corporate-registry",
          "title": "법인등기부등본",
          "conditional": true,
          "rule": {
            "kind": "age_days",
            "days": 14
          },
          "guidance": "말소 포함 제출용. 보유본 우선, 신청 기준 2주 이내 최신본 재요청."
        },
        {
          "key": "vat",
          "title": "부가가치세 과세표준증명원",
          "rule": {
            "kind": "years",
            "years": 3,
            "manualPeriod": true,
            "allowShortHistory": true
          },
          "guidance": "최근 3개년 또는 업력 내 기간. 최근 신고기간도 원문 대조."
        },
        {
          "key": "financial-statements",
          "title": "재무제표·감사보고서",
          "rule": {
            "kind": "years",
            "years": 3,
            "allowShortHistory": true
          }
        },
        {
          "key": "employment-history",
          "title": "고용보험 사업장 취득자 명부",
          "rule": {
            "kind": "years",
            "years": 3,
            "yearEnd": true,
            "allowShortHistory": true
          },
          "guidance": "연도별 12월 말 기준, 업력 내 기간."
        },
        {
          "key": "insurance-roster",
          "title": "4대보험 가입자 명부",
          "rule": {
            "kind": "age_days",
            "days": 14
          }
        },
        {
          "key": "career-proof",
          "title": "대표자 경력 증빙",
          "guidance": "안내된 경력 증빙 중 택1, 동종업계 경력 원문 검토."
        },
        {
          "key": "qualification",
          "title": "대표자 국가기술자격 증빙",
          "conditional": true
        }
      ]
    },
    "VENTURE_INVEST": {
      "label": "벤처 · 벤처투자유형",
      "url": "https://honestone.notion.site/ventureappli",
      "documents": [
        {
          "key": "business-registration",
          "title": "사업자등록증"
        },
        {
          "key": "corporate-registry",
          "title": "법인등기부등본",
          "conditional": true,
          "rule": {
            "kind": "age_days",
            "days": 14
          },
          "guidance": "보유본 우선, 신청 시 2주 이내 발급분."
        },
        {
          "key": "vat",
          "title": "부가가치세 과세표준증명원",
          "rule": {
            "kind": "years",
            "years": 3,
            "manualPeriod": true,
            "allowShortHistory": true
          },
          "guidance": "최근 3개년·업력 내 기간 + 최근 신고분 별도 확인."
        },
        {
          "key": "financial-statements",
          "title": "재무제표·감사보고서",
          "rule": {
            "kind": "years",
            "years": 3,
            "allowShortHistory": true
          }
        },
        {
          "key": "employment-history",
          "title": "고용보험 사업장 취득자 명부",
          "rule": {
            "kind": "years",
            "years": 3,
            "yearEnd": true,
            "allowShortHistory": true
          }
        },
        {
          "key": "shareholders",
          "title": "현재 주주명부",
          "guidance": "최신 여부는 회사에 확인. 임의 일수 제한 없음."
        },
        {
          "key": "signing",
          "title": "법무사 제출·서명 확인",
          "guidance": "서명 절차·민감한 투자자 정보는 별도 권한과 목적 확인."
        }
      ]
    },
    "INNOBIZ": {
      "label": "이노비즈",
      "url": "https://honestone.notion.site/ino",
      "documents": [
        {
          "key": "business-registration",
          "title": "사업자등록증·증명원"
        },
        {
          "key": "corporate-registry",
          "title": "법인등기부등본",
          "conditional": true,
          "rule": {
            "kind": "age_months",
            "months": 1
          },
          "guidance": "제출용·말소 포함. 개인사업자 생략 가능."
        },
        {
          "key": "shareholders",
          "title": "주주명부",
          "conditional": true
        },
        {
          "key": "organization",
          "title": "조직도"
        },
        {
          "key": "financial-statements",
          "title": "표준재무제표증명원",
          "rule": {
            "kind": "years",
            "years": 3
          }
        },
        {
          "key": "vat",
          "title": "부가가치세 과세표준증명원",
          "rule": {
            "kind": "years",
            "years": 3,
            "manualPeriod": true
          },
          "guidance": "최근 3개년~직전 분기까지. 최근 신고기간 원문 대조 필요."
        },
        {
          "key": "national-tax",
          "title": "국세 납세증명서",
          "rule": {
            "kind": "age_months",
            "months": 1
          }
        },
        {
          "key": "local-tax",
          "title": "지방세 납세증명서",
          "rule": {
            "kind": "age_months",
            "months": 1
          }
        },
        {
          "key": "insurance-payment",
          "title": "4대보험 완납증명서",
          "rule": {
            "kind": "age_months",
            "months": 1
          }
        },
        {
          "key": "insurance-roster",
          "title": "4대보험 사업장 가입자 명부",
          "rule": {
            "kind": "age_months",
            "months": 1
          }
        },
        {
          "key": "ip",
          "title": "지식재산권 등록원부",
          "conditional": true
        },
        {
          "key": "research",
          "title": "연구소 인정서·인력 현황 또는 연구부서 증빙"
        },
        {
          "key": "ir",
          "title": "기업 소개·IR 자료",
          "conditional": true
        },
        {
          "key": "certifications",
          "title": "인증·수상·지역 우수기업 증빙",
          "conditional": true
        },
        {
          "key": "manual",
          "title": "ISO 매뉴얼·절차서·조직관리 서류"
        }
      ]
    },
    "MAINBIZ": {
      "label": "메인비즈",
      "url": "https://honestone.notion.site/mainbiz",
      "documents": [
        {
          "key": "corporate-registry",
          "title": "법인등기부등본",
          "conditional": true,
          "guidance": "말소 포함, 개인기업 제외. 노션에 발급 일수 제한 없음."
        },
        {
          "key": "credit",
          "title": "신용정보조회서",
          "guidance": "평가기관별 요구 상이. 최신 요구 확인."
        },
        {
          "key": "financial-statements",
          "title": "표준재무제표 증명원",
          "rule": {
            "kind": "years",
            "years": 3
          }
        },
        {
          "key": "accident-rate",
          "title": "사업장 산업재해율",
          "conditional": true,
          "guidance": "제조·건설업 해당."
        },
        {
          "key": "introduction",
          "title": "기업 소개·조직도"
        },
        {
          "key": "business-plan",
          "title": "경영계획서"
        },
        {
          "key": "procedures",
          "title": "생산 표준·업무 프로세스·고객관리 문서"
        },
        {
          "key": "hr-rules",
          "title": "경영방침·사내규정"
        },
        {
          "key": "customer-sales",
          "title": "핵심고객 매출자료",
          "rule": {
            "kind": "years",
            "years": 3
          }
        },
        {
          "key": "employee-count",
          "title": "상시근로자·퇴사인원 자료",
          "rule": {
            "kind": "years",
            "years": 3
          }
        },
        {
          "key": "satisfaction",
          "title": "고객만족 측정 결과"
        }
      ]
    },
    "RESEARCH": {
      "label": "기업부설연구소",
      "url": "https://honestone.notion.site/rndask",
      "documents": [
        {
          "key": "business-registration",
          "title": "사업자등록증"
        },
        {
          "key": "insurance-roster",
          "title": "4대보험 가입자 명부"
        },
        {
          "key": "sme-certificate",
          "title": "중소기업확인서",
          "rule": {
            "kind": "expiry",
            "required": true
          }
        },
        {
          "key": "industry-proof",
          "title": "주업종 확인서류",
          "guidance": "세무사 요청 중소기업 기준검토표·명판·날인."
        },
        {
          "key": "financial-statements",
          "title": "직전 3개년 재무제표",
          "rule": {
            "kind": "years",
            "years": 3
          }
        },
        {
          "key": "degree",
          "title": "연구원 졸업증명서"
        },
        {
          "key": "facility",
          "title": "연구소 명판·내부 사진"
        }
      ]
    },
    "OTHER": {
      "label": "기타 · 원문에 적힌 유효기간만 확인",
      "url": "https://honestone.notion.site/applications",
      "documents": []
    }
  }
};
