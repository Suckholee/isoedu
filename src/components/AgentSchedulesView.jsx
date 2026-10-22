'use client';

import Link from 'next/link';
import { ArrowUpRight, Bot, Clock3, Repeat2 } from 'lucide-react';

const steps = [
  ['예약 시간에 시작', '매일 한국시간 오전 9시에 에이전트가 정해 둔 업무를 시작합니다.'],
  ['수집하고 분석', '정부지원사업 공고와 첨부자료를 확인하고, 신규·변경 공고와 남은 분석을 이어갑니다.'],
  ['결과를 확인', '저장된 수집·분석 결과는 정부지원사업 화면에서 확인합니다. 변경·실패·조치가 필요할 때 알립니다.'],
];

export default function AgentSchedulesView() {
  return <div className="agent-schedules">
    <header className="platform-page-heading">
      <div><h1>예약된 에이전트 실행목록</h1><p>반복 업무를 예약하면, 에이전트가 매일 정해진 시간에 진행합니다.</p></div>
    </header>

    <section className="platform-card agent-schedule-list" aria-labelledby="agent-list-title">
      <div className="agent-section-heading"><h2 id="agent-list-title"><Bot size={18} aria-hidden="true"/>등록된 예약 <span className="agent-count">1</span></h2><span>한국시간 · Asia/Seoul</span></div>
      <div className="agent-table-scroll">
        <table className="platform-table agent-schedule-table">
          <caption className="sr-only">2026년 10월 18일 확인한 예약 설정. 실시간 실행 상태와는 다릅니다.</caption>
          <thead><tr><th scope="col">에이전트 업무</th><th scope="col">실행 주기</th><th scope="col">예약 설정</th><th scope="col">결과</th></tr></thead>
          <tbody><tr>
            <td><strong>정부지원사업 수집·분석</strong><small>어니스톤 정부지원사업 매일 업데이트</small></td>
            <td><span className="agent-time"><Repeat2 size={14} aria-hidden="true"/>매일 오전 9:00</span></td>
            <td><span className="agent-status">활성 · 확인 시점 기준</span></td>
            <td><Link href="/government-programs" className="agent-link">수집 결과 보기 <ArrowUpRight size={14} aria-hidden="true"/></Link></td>
          </tr></tbody>
        </table>
      </div>
      <p className="agent-sync-note">예약 설정 확인: 2026.10.18 · Codex에서 실행하는 예약 업무입니다. 이 목록은 실시간 실행 상태와 자동 동기화되지 않습니다.</p>
    </section>

    <div className="agent-explainer-grid">
      <section className="platform-card" aria-labelledby="agent-how-title">
        <h2 id="agent-how-title"><Clock3 size={18} aria-hidden="true"/>매일 이렇게 진행할 수 있어요</h2>
        <p className="agent-intro">같은 요청을 매번 입력할 필요 없이, 실행 시간과 할 일을 미리 정해 둡니다.</p>
        <ol className="agent-steps">{steps.map(([title, description], index) => <li key={title}>
          <span className="agent-step-number" aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div>
        </li>)}</ol>
        <div className="agent-example-request"><span>예약 요청 예시</span><p>“매일 한국시간 오전 9시에 정부지원사업 공고를 확인하고, 신규·변경 내용과 필요한 서류를 정리해 줘.”</p></div>
        <p className="agent-sync-note">예약은 Codex에서 설정합니다. 실제 시작 시각과 완료 여부는 실행 환경·네트워크 상태에 따라 달라질 수 있습니다.</p>
      </section>

      <section className="platform-card" aria-labelledby="agent-example-title">
        <div className="agent-section-heading"><h2 id="agent-example-title">예약 실행 화면 예시</h2><a href="/images/agent-schedules/daily-run-example.png" target="_blank" rel="noreferrer" className="agent-link" aria-label="예약 실행 스크린샷 원본 크게 보기 (새 탭)">크게 보기 <ArrowUpRight size={14} aria-hidden="true"/></a></div>
        <figure className="agent-screenshot">
          <a href="/images/agent-schedules/daily-run-example.png" target="_blank" rel="noreferrer" aria-label="예약 실행 스크린샷 원본 열기 (새 탭)"><img src="/images/agent-schedules/daily-run-example.png" width="1040" height="750" alt="Codex 대화에 예약된 작업으로 전송됨과 매일 한국시간 오전 9시 요청이 표시된 화면. 하단에는 작업 중 및 네트워크 재연결 대기 상태가 보입니다."/></a>
          <figcaption>사용자가 제공한 실제 화면입니다. ‘예약된 작업으로 전송됨’은 예약 요청이 전달되었다는 표시입니다. 이 캡처는 네트워크 재연결 대기 중으로, 작업 완료를 뜻하지 않습니다.</figcaption>
        </figure>
      </section>
    </div>
  </div>;
}
