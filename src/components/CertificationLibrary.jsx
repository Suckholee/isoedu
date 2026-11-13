'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, ClipboardList, ExternalLink, FileText, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import styles from './CertificationLibrary.module.css';

const categories = { all: '전체', domestic: '국내', international: '국제·해외' };
const normalize = value => value.toLowerCase().replace(/[\s/·-]+/g, '');
const matches = (guide, query) => normalize(
  [guide.id.replaceAll('_', ' '), guide.name, guide.type, guide.summary, guide.audience].join(' ')
).includes(normalize(query));

export default function CertificationLibrary() {
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const selectedId = search.get('guide');
  const category = ['domestic', 'international'].includes(search.get('market')) ? search.get('market') : 'all';
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const accountId = user?.id;
  const pageRef = useRef(null);
  const previousGuide = useRef(selectedId);

  useEffect(() => {
    if (previousGuide.current !== selectedId) {
      pageRef.current?.closest('.platform-scroll')?.scrollTo({ top: 0 });
      previousGuide.current = selectedId;
    }
  }, [selectedId]);

  useEffect(() => {
    if (!accountId) {
      setResult(null);
      return;
    }
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/certification-library', { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.guides)) {
          throw new Error(data.error || '자료를 불러오지 못했습니다.');
        }
        if (!controller.signal.aborted) setResult({ accountId, attempt, guides: data.guides });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ accountId, attempt, error: error.message });
      }
    }
    load();
    return () => controller.abort();
  }, [accountId, attempt]);

  function updateSearch(patch, method = 'push') {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router[method](next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function selectGuide(id) {
    updateSearch({ guide: id });
  }

  const current = result?.accountId === accountId && result?.attempt === attempt ? result : null;
  const guides = current?.guides || [];
  const filtered = guides.filter(guide => (category === 'all' || category === guide.category) && matches(guide, query));
  const selected = guides.find(guide => guide.id === selectedId);

  return (
    <section ref={pageRef} className={styles.page} data-reading={Boolean(selectedId && current?.guides)}>
      <header className={styles.heading}>
        <div className={styles.headingTitle}>
          <span className={styles.headingIcon}><BookOpen size={22} aria-hidden="true" /></span>
          <div><h1>인증 자료실</h1><p>국내외 인증의 준비 절차와 서류를 찾아보세요.</p></div>
        </div>
        <span className={styles.free}>회원 무료</span>
      </header>
      {isLoading && !accountId ? <p className={styles.state} role="status">로그인 상태를 확인하고 있습니다.</p>
        : !accountId ? <div className={styles.state}>
          <h2>로그인하고 자료 열람</h2>
          <p>기업회원과 컨설턴트 모두 로그인하면 회사 선택 없이 열람할 수 있습니다.</p>
          <button type="button" className={styles.primary} onClick={() => setAuthOpen(true)}>로그인 · 회원가입</button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
        : !current ? <p className={styles.state} role="status">인증 자료를 불러오고 있습니다.</p>
        : current.error ? <div className={styles.state}><p role="alert">{current.error}</p>
          <button type="button" className={styles.primary} onClick={() => setAttempt(value => value + 1)}>다시 불러오기</button>
        </div>
        : <>
          <div className={styles.filters}>
            <nav aria-label="인증 지역">
              {Object.entries(categories).map(([id, label]) => <button type="button" key={id}
                aria-pressed={category === id}
                onClick={() => updateSearch({ market: id === 'all' ? null : id, guide: null }, 'replace')}>
                {label}<span>{id === 'all' ? guides.length : guides.filter(guide => guide.category === id).length}</span>
              </button>)}
            </nav>
            <label className={styles.search}><Search size={17} aria-hidden="true" />
              <input type="search" aria-label="인증 자료 검색" value={query} onChange={event => setQuery(event.target.value)}
                placeholder="인증명, 규격 번호 검색" />
            </label>
          </div>
          <div className={styles.workspace} data-detail={Boolean(selectedId)}>
            <aside className={styles.listPanel} aria-label="인증 목록">
              <div className={styles.listHeading}><h2>인증 목록</h2><span role="status">{filtered.length}건</span></div>
              <div className={styles.list}>
                {filtered.length ? filtered.map(guide => <button type="button" key={guide.id}
                  aria-current={guide.id === selectedId ? 'page' : undefined} onClick={() => selectGuide(guide.id)}>
                  <FileText size={16} className={styles.rowIcon} aria-hidden="true" />
                  <span><strong>{guide.name}</strong><small>{guide.type}</small></span><ChevronRight size={16} aria-hidden="true" />
                </button>) : <p className={styles.listEmpty}>검색 조건에 맞는 인증이 없습니다.</p>}
              </div>
            </aside>
            <article className={styles.detail} aria-label="인증 매뉴얼">
              {selectedId && <button type="button" className={styles.back} onClick={() => selectGuide(null)}>
                <ArrowLeft size={16} aria-hidden="true" /> 인증 목록
              </button>}
              {selected ? <Guide key={selected.id} guide={selected} /> : <div className={styles.emptyGuide}>
                <span className={styles.headingIcon}><BookOpen size={22} aria-hidden="true" /></span>
                <p>{selectedId ? '해당 인증 자료를 찾을 수 없습니다.' : '목록에서 인증을 선택하면 준비 매뉴얼이 열립니다.'}</p>
              </div>}
            </article>
          </div>
        </>}
    </section>
  );
}

function Guide({ guide }) {
  return (
    <>
      <header className={styles.guideHeading}>
        <p>{categories[guide.category]} · {guide.type}</p>
        <h2>{guide.name}</h2>
        <p>{guide.summary}</p>
      </header>
      <section><h3>검토 대상</h3><p>{guide.audience}</p></section>
      <section><h3>준비 순서</h3><ol className={styles.steps} role="list">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
      <section><h3>먼저 모아둘 자료</h3><ul>{guide.evidence.map(item => <li key={item}>{item}</li>)}</ul></section>
      {guide.checklist.length > 0 && <details className={styles.checklist}>
        <summary><ClipboardList size={18} aria-hidden="true" /> <span>어니스톤 서류 준비 목록</span><small>{guide.checklist.length}건</small><ChevronDown className={styles.checklistChevron} size={17} aria-hidden="true" /></summary>
        <p>준비용 목록입니다. 실제 제출 여부와 발급 기준은 신청 기관에서 확인하세요.</p>
        <ul>{guide.checklist.map(item => <li key={item.key}>
          <strong>{item.title}</strong>{item.conditional && <small>해당 시</small>}
          {item.guidance && <p>{item.guidance}</p>}
        </li>)}</ul>
        {guide.preparationSource && <a href={guide.preparationSource} target="_blank" rel="noreferrer">
          어니스톤 원본 안내 <ExternalLink size={13} aria-hidden="true" />
        </a>}
      </details>}
      <section className={styles.sources}>
        <p>{guide.caution}</p>
        <a href={guide.source.url} target="_blank" rel="noreferrer">
          {guide.source.name} <ExternalLink size={14} aria-hidden="true" />
        </a>
      </section>
    </>
  );
}
