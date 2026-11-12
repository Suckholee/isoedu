'use client';

import {useState} from 'react';
import {ArrowUpRight, Download} from 'lucide-react';
import {certificationReport, CONSULTATION_URL, reportText} from '../lib/certificationReport.mjs';
import styles from './GrowthLanding.module.css';

const services = [
  ['review', '전문가 검토 문의', '우리 회사나 제품에 어떤 요건이 적용되는지, 리포트와 보유 자료를 함께 검토합니다.'],
  ['execution', '인증 준비 용역 문의', '시험·심사 준비, 제출 서류 정리, 일정 관리 등 필요한 지원 범위와 견적을 협의합니다.'],
];

export default function CertificationReport({draft}) {
  const [service, setService] = useState('');
  const report = certificationReport(draft);
  const selected = services.find(([key]) => key === service);

  function download() {
    const url = URL.createObjectURL(new Blob(['\ufeff', reportText(report)], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = '써티멘토-인증-준비-리포트.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <article className={styles.report} aria-labelledby="cert-report-title">
      <div className={styles.reportHeader}>
        <div><p className={styles.eyebrow}>무료 리포트</p><h3 id="cert-report-title">{report.title}</h3></div>
        <button type="button" className={styles.reportDownload} onClick={download}><Download size={16}/> 리포트 다운로드</button>
      </div>
      <p className={styles.summary}>{report.scope}</p>
      <dl className={styles.reportFacts}>{report.facts.map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      )}</dl>
      <div className={styles.result}><strong>먼저 확인할 일</strong><ol>{report.steps.map(step => <li key={step}>{step}</li>)}</ol></div>
      {report.missing.length > 0 && <div className={styles.reportMissing}>
        <strong>추가로 확인할 정보</strong><ul>{report.missing.map(item => <li key={item}>{item}</li>)}</ul>
      </div>}
      <p className={styles.small}>{report.note}</p>
    </article>
    <section className={styles.reportServices} aria-labelledby="cert-consult-title">
      <h4 id="cert-consult-title">추가 지원이 필요하신가요?</h4>
      <div className={styles.reportServiceChoices}>
        {services.map(([key, title]) =>
          <button key={key} type="button" aria-pressed={service === key} onClick={() => setService(key)}>{title}</button>
        )}
      </div>
      {selected && <div className={styles.reportServiceDetail}>
        <p>{selected[2]}</p>
        <p>어니스톤 상담 페이지에서 문의 내용을 직접 입력해 주세요. 상담에서 진행 범위와 비용을 확인할 수 있습니다.</p>
        <a href={CONSULTATION_URL} target="_blank" rel="noopener noreferrer">상담 신청 페이지 열기 <ArrowUpRight size={15}/></a>
      </div>}
    </section>
  </>;
}
