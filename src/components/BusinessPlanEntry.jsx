'use client';

import {useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import AuthModal from './AuthModal';
import VentureDocumentWorkspace from './venture/VentureDocumentWorkspace';
import {useAuth} from '../context/AuthContext';
import {projectDraft} from '../lib/projectWorkflow.mjs';
import {createProject} from '../lib/workspaceRepository';

export default function BusinessPlanEntry({
  companies, company, projects, documents, ready, loadError, onProjectCreated,
}) {
  const {user, isLoading} = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);

  const companyProjects = projects.filter(project => project.companyId === company?.id);
  const requestedProjectId = search.get('planProject');
  const project = companyProjects.find(item => item.id === requestedProjectId);

  function changeSelection(nextCompany, nextProject) {
    const params = new URLSearchParams(search.toString());
    for (const key of ['planProject', 'document', 'section']) params.delete(key);
    params.set('company', nextCompany);
    if (nextProject) params.set('planProject', nextProject);
    router.push('/business-plan?' + params.toString(), {scroll: false});
  }

  async function startPlan() {
    if (saving || !company?.canEdit || !ready) return;
    if (request.current?.companyId !== company.id) {
      request.current = {companyId: company.id, id: crypto.randomUUID()};
    }
    setSaving(true);
    setError('');
    try {
      const draft = projectDraft({
        companyId: company.id,
        title: '사업계획서 작성',
        kind: 'GENERAL',
        requestId: request.current.id,
      });
      const saved = await createProject(draft);
      if (onProjectCreated(saved)) changeSelection(saved.companyId, saved.id);
      request.current = null;
    } catch (failure) {
      setError(failure.message || '작성 공간을 만들지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (project) {
    return <section className="flex h-full min-h-[36rem] flex-col bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm">
        <span className="font-medium">{company.name} · {project.title}</span>
        <button className="text-blue-700 underline" onClick={() => changeSelection(company.id)}>
          작성 목록
        </button>
      </header>
      <VentureDocumentWorkspace
        key={project.id}
        project={project}
        documents={documents.filter(item => item.companyId === company.id)}
        canEdit={company.canEdit}
        applicationType={project.operations?.applicationType ?? (project.kind === 'ISO' ? 'ISO' : 'OTHER')}
        compact
      />
    </section>;
  }

  return <section className="mx-auto max-w-3xl space-y-5 p-5 sm:p-8">
    <h1 className="text-2xl font-bold text-slate-900">사업계획서 만들기</h1>
    {isLoading ? <p role="status">로그인 상태를 확인하고 있습니다.</p> : !user ? <>
      <p>로그인하면 회사에 사업계획서를 만들고 저장할 수 있습니다.</p>
      <button className="work-primary" onClick={() => setShowLogin(true)}>로그인하고 시작</button>
      <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </> : loadError ? <p role="alert">작성 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>
    : !ready ? <p role="status">회사와 작성 목록을 불러오는 중입니다.</p>
    : !companies.length ? <p>연결된 회사가 없습니다. 회사 관리자에게 소속 연결을 요청해 주세요.</p>
    : <>
      {requestedProjectId && <p role="alert">선택한 작성 공간을 열 수 없습니다. 아래에서 다시 선택해 주세요.</p>}
      <label className="block max-w-md text-sm font-medium">
        작성할 회사
        <select
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2.5"
          value={company?.id || ''}
          onChange={event => {setError(''); changeSelection(event.target.value);}}
          disabled={saving}
        >
          <option value="">회사 선택</option>
          {companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {company && <>
        {company.canEdit
          ? <button className="work-primary" disabled={saving} onClick={startPlan}>
              {saving ? '작성 공간을 여는 중…' : '새 사업계획서 만들기'}
            </button>
          : <p>이 회사의 사업계획서는 열람할 수 있습니다. 새 계획서를 작성하려면 회사 편집 권한이 필요합니다.</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {companyProjects.length > 0 && <section aria-labelledby="plan-workspaces-title">
          <h2 id="plan-workspaces-title" className="mb-2 font-semibold">기존 프로젝트에서 열기</h2>
          <ul className="divide-y rounded-lg border bg-white">
            {companyProjects.map(item => <li key={item.id}>
              <button
                className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-slate-50"
                onClick={() => changeSelection(company.id, item.id)}
                disabled={saving}
              >
                <span>{item.title || '사업계획서'}</span>
                <span className="shrink-0 text-blue-700">열기 →</span>
              </button>
            </li>)}
          </ul>
        </section>}
      </>}
    </>}
  </section>;
}
