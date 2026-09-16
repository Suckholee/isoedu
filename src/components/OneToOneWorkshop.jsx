'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Camera, Check, CheckCircle2, Copy, Download, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { EMPTY_PROFILE, STEPS, newMeeting, draftErrors, makeDraft, makePrompt, safePublishedUrl, canComplete } from '../lib/oneToOneBlog.mjs';
import { readWorkshop, saveWorkshop } from '../lib/oneToOneStorage';

const fieldStyle = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed';
const primaryStyle = `${buttonStyle} !border-teal-800 !bg-teal-800 !text-white hover:!bg-teal-900`;
function Field({ label, value, onChange, multiline, hint, ...props }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{multiline ? <textarea {...props} className={fieldStyle} rows={props.rows || 3} value={value || ''} onChange={e => onChange(e.target.value)} /> : <input {...props} className={fieldStyle} value={value || ''} onChange={e => onChange(e.target.value)} />}{hint && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}</label>;
}
function Section({ title, description, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-bold text-slate-900">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}<div className="mt-6 space-y-5">{children}</div></section>;
}
function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function fileData(blob) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.')); reader.readAsDataURL(blob); });
}
const escapeHtml = text => String(text || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export default function OneToOneWorkshop({ standalone = false }) {
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('자료 불러오는 중…');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState({});
  const [preview, setPreview] = useState(false);
  const saveVersion = useRef(0);
  const uploadLock = useRef(false);
  useEffect(() => {
    let active = true;
    readWorkshop().then(stored => {
      if (!active) return;
      setData(stored || { profile: { ...EMPTY_PROFILE }, meeting: newMeeting(), assets: [], records: [] });
    }).catch(() => { if (active) { setError('브라우저 저장소를 열지 못했습니다. 저장 공간과 브라우저 설정을 확인하고 새로고침해 주세요.'); setStatus('저장소 연결 실패'); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!data) return;
    const version = ++saveVersion.current;
    setStatus('저장 중…');
    saveWorkshop(data).then(() => { if (version === saveVersion.current) setStatus('이 브라우저에 저장됨'); }).catch(() => { if (version === saveVersion.current) { setStatus('저장 실패'); setError('저장 공간이 부족하거나 브라우저 저장이 차단되었습니다. 작성한 글을 복사하거나 HTML로 내려받아 주세요.'); } });
  }, [data]);
  useEffect(() => {
    const next = Object.fromEntries((data?.assets || []).filter(a => a.kind === 'photo').map(a => [a.id, URL.createObjectURL(a.file)]));
    setUrls(next);
    return () => Object.values(next).forEach(url => URL.revokeObjectURL(url));
  }, [data?.assets]);
  if (!data) return <div className="p-10" role="status">{error || status}</div>;
  const { profile, meeting, assets, records } = data;
  const patchMeeting = patch => setData(prev => ({ ...prev, meeting: { ...prev.meeting, ...patch, checks: patch.checks || { facts: false, disclosure: false, both: false } } }));
  const patchProfile = (key, value) => setData(prev => ({ ...prev, profile: { ...prev.profile, [key]: value }, meeting: { ...prev.meeting, checks: { facts: false, disclosure: false, both: false } } }));
  const photos = assets.filter(a => a.kind === 'photo');
  const selectedPhotos = meeting.photoIds.map(id => photos.find(a => a.id === id)).filter(Boolean);
  const orderedPhotos = [...selectedPhotos].sort((a, b) => Number(b.id === meeting.coverId) - Number(a.id === meeting.coverId));
  const missing = draftErrors(profile, meeting);
  const caption = `${meeting.date || '날짜 미입력'} ${meeting.place || ''} · ${profile.name || '작성자'}님과 ${meeting.partner || '미팅 상대'}님의 BNI 원투원`;
  const reviewed = Object.values(meeting.checks).every(Boolean);
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); setMessage('클립보드에 복사했습니다.'); } catch { setError('복사 권한을 확인해 주세요. 편집창에서 글을 직접 선택해 복사할 수도 있습니다.'); }
  }
  async function upload(event, kind) {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length || uploadLock.current) return;
    uploadLock.current = true; setBusy(true); setError('');
    try {
      if (assets.reduce((sum, a) => sum + a.file.size, 0) + files.reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024) throw new Error('실습 자료는 전체 50MB까지 보관할 수 있습니다. 사용하지 않는 자료를 삭제해 주세요.');
      const added = [];
      for (const file of files) {
        const maxMB = kind === 'photo' ? 10 : 25;
        if (file.size > maxMB * 1024 * 1024) throw new Error(`${file.name}: 파일당 ${maxMB}MB 이하로 올려 주세요.`);
        if (kind === 'photo') {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('사진은 JPG, PNG, WebP 형식을 사용해 주세요.');
          const url = URL.createObjectURL(file);
          try { await new Promise((resolve, reject) => { const img = new Image(); img.onload = resolve; img.onerror = () => reject(new Error('열 수 없는 이미지입니다.')); img.src = url; }); } finally { URL.revokeObjectURL(url); }
        } else if (file.name.startsWith('~$') || !/\.(pdf|pptx)$/i.test(file.name)) throw new Error('임시 파일(~$)을 제외한 PDF 또는 PPTX 원본을 올려 주세요.');
        added.push({ id: crypto.randomUUID(), kind, name: file.name, file, meetingId: kind === 'partner-source' ? meeting.id : null });
      }
      setData(prev => ({ ...prev, assets: [...prev.assets, ...added], meeting: { ...prev.meeting, photoIds: kind === 'photo' ? [...prev.meeting.photoIds, ...added.map(a => a.id)] : prev.meeting.photoIds, coverId: kind === 'photo' && !prev.meeting.coverId ? added[0].id : prev.meeting.coverId, checks: { facts: false, disclosure: false, both: false } } }));
      setMessage(`${files.length}개 파일을 등록했습니다.`);
    } catch (e) { setError(e.message); } finally { uploadLock.current = false; setBusy(false); }
  }
  function removeAsset(id) {
    setData(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }));
  }
  function selectPhoto(id) {
    const ids = meeting.photoIds.includes(id) ? meeting.photoIds.filter(p => p !== id) : [...meeting.photoIds, id];
    patchMeeting({ photoIds: ids, coverId: ids.includes(meeting.coverId) ? meeting.coverId : ids[0] || '' });
  }
  function generate() {
    if (missing.length) { setError(`먼저 입력해 주세요: ${missing.join(', ')}`); return; }
    if (meeting.body.trim() && !window.confirm('현재 편집한 제목과 본문을 입력 자료로 다시 구성할까요?')) return;
    patchMeeting(makeDraft(profile, meeting)); setMessage('입력한 사실로 기본 초안을 구성했습니다. 문장을 다듬어 주세요.');
  }
  function archive() {
    const record = { ...meeting, author: { ...profile }, savedAt: new Date().toISOString() };
    setData(prev => ({ ...prev, records: [record, ...prev.records.filter(r => r.id !== record.id)] }));
    setMessage(canComplete(meeting) ? '발행 주소와 실습 결과를 보관했습니다.' : '작성 중인 미팅을 보관했습니다. 나중에 이어서 작성할 수 있습니다.');
  }
  async function exportHtml() {
    setBusy(true); setError('');
    try {
      const figures = await Promise.all(orderedPhotos.map(async photo => `<figure><img src="${await fileData(photo.file)}" alt="${escapeHtml(caption)}"><figcaption>${escapeHtml(caption)}</figcaption></figure>`));
      const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(meeting.title)}</title><style>body{max-width:760px;margin:48px auto;padding:0 24px;font:17px/1.9 sans-serif;color:#1e293b}h1{font-size:30px;line-height:1.4}img{max-width:100%;height:auto}figure{margin:32px 0}figcaption{font-size:13px;color:#64748b}.body{white-space:pre-wrap}</style><h1>${escapeHtml(meeting.title)}</h1>${figures[0] || ''}<div class="body">${escapeHtml(meeting.body)}</div>${figures.slice(1).join('')}</html>`;
      saveFile(new Blob([html], { type: 'text/html;charset=utf-8' }), `원투원-${meeting.date || '초안'}.html`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function sourceFiles(kind) {
    return <div className="space-y-2"><label className={`${buttonStyle} cursor-pointer`}><FileText size={16} />양식 파일 등록<input aria-label={kind === 'my-source' ? '내 원투원 양식 업로드' : '상대방 원투원 양식 업로드'} type="file" accept=".pdf,.pptx" multiple disabled={busy} className="sr-only" onChange={e => upload(e, kind)} /></label><p className="text-xs leading-5 text-slate-500">PDF·PPTX 원본 보관 · 파일당 25MB. 자동 분석은 지원하지 않으며, 공개할 핵심 내용을 아래에 직접 정리합니다.</p>{assets.filter(a => a.kind === kind && (kind !== 'partner-source' || a.meetingId === meeting.id)).map(a => <div key={a.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs"><button className="min-w-0 flex-1 truncate text-left underline" onClick={() => saveFile(a.file, a.name)}>{a.name}</button><button aria-label={`${a.name} 삭제`} onClick={() => removeAsset(a.id)}><Trash2 size={14} /></button></div>)}</div>;
  }
  return <div className={`${standalone ? 'min-h-screen bg-[#f6f8f7] px-4 py-6 sm:px-8' : 'py-6'} text-slate-800`}>
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">{standalone ? <a href="/" className="inline-flex items-center gap-2 hover:text-teal-800"><ArrowLeft size={14} />ISOEdu 홈</a> : <span>ISOEdu · 콘텐츠 제작 실습</span>}<span role="status">{status}</span></div>
      <header className="mb-8 border-b border-slate-200 pb-7">
        <p className="mb-3 text-xs font-bold tracking-widest text-teal-700">BNI 121 · BLOG WORKSHOP</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">한 번의 만남, 두 사람의 사업 이야기</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">원투원 양식과 함께 찍은 사진, 실제 나눈 대화로 나와 상대방을 소개하세요.<br className="hidden sm:block" />완성한 글을 블로그에 발행하고, 우리의 사업 활동을 인터넷에 남깁니다.</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span>실습 결과 · 사진이 담긴 블로그 글 1편</span><span>준비물 · 두 사람의 양식, 미팅 사진, 대화 메모</span></div>
      </header>
      <div className="mb-5 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-6 text-teal-900">시작 전 사용할 블로그에 회원가입·로그인을 해 주세요. 이 실습의 자료는 현재 브라우저에만 저장됩니다. 외부 드라이브·계정 연동 및 자동 발행은 제공하지 않습니다.</div>
      <nav aria-label="실습 단계" className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-5">{STEPS.map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} onClick={() => { setStep(i); setError(''); setMessage(''); }} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold ${step === i ? 'bg-teal-800 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-500'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${step === i ? 'bg-white/20' : 'bg-slate-100'}`}>{i + 1}</span>{label}</button>)}</nav>
      {error && <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-900">{message}</div>}
      {step === 0 && <div className="grid gap-6 lg:grid-cols-2">
        <Section title="나의 사업" description="여러 만남에서 반복해서 사용할 소개 자료입니다. 공개할 내용만 입력하세요.">
          {sourceFiles('my-source')}
          <div className="grid gap-4 sm:grid-cols-2"><Field label="내 이름 *" value={profile.name} onChange={v => patchProfile('name', v)} /><Field label="내 회사·브랜드 *" value={profile.business} onChange={v => patchProfile('business', v)} /></div>
          <Field label="어떤 서비스를 제공하나요? *" multiline value={profile.service} onChange={v => patchProfile('service', v)} placeholder="고객의 어떤 문제를 어떻게 해결하는지 적어 주세요." />
          <Field label="도움이 필요한 고객" value={profile.customer} onChange={v => patchProfile('customer', v)} />
          <Field label="공개할 문의 경로" value={profile.contact} onChange={v => patchProfile('contact', v)} placeholder="홈페이지, 이메일 또는 상담 채널" />
          <Field label="양식에서 가져온 사업 배경·경험" multiline value={profile.sourceNotes} onChange={v => patchProfile('sourceNotes', v)} hint="AI 작성 프롬프트에 참고 자료로 포함됩니다. 실제 성과와 앞으로의 목표를 구분해 주세요." />
        </Section>
        <Section title="이번에 만난 사람" description="상대방이 이 실습 서비스에 가입하지 않아도 작성할 수 있습니다.">
          {sourceFiles('partner-source')}
          <div className="grid gap-4 sm:grid-cols-2"><Field label="상대방 이름 *" value={meeting.partner} onChange={v => patchMeeting({ partner: v })} /><Field label="상대방 회사·브랜드 *" value={meeting.business} onChange={v => patchMeeting({ business: v })} /></div>
          <Field label="상대방은 어떤 서비스를 제공하나요? *" multiline value={meeting.service} onChange={v => patchMeeting({ service: v })} />
          <Field label="상대방의 주요 고객" value={meeting.customer} onChange={v => patchMeeting({ customer: v })} />
          <Field label="상대방의 공개 문의 경로" value={meeting.contact} onChange={v => patchMeeting({ contact: v })} />
          <Field label="상대방 양식의 사업 배경·경험" multiline value={meeting.sourceNotes} onChange={v => patchMeeting({ sourceNotes: v })} hint="공개할 내용만 정리하고, 과거 직함이나 수치는 현재도 맞는지 확인하세요." />
        </Section>
      </div>}
      {step === 1 && <Section title="원투원 사진 드라이브" description="사진을 올린 뒤 이번 미팅에 사용할 사진을 선택하세요. 다른 미팅의 사진도 이곳에 보관하고 다시 선택할 수 있습니다.">
        <div className="flex flex-wrap items-center justify-between gap-3"><label className={`${primaryStyle} cursor-pointer`}><Camera size={17} />사진 올리기<input type="file" aria-label="원투원 사진 업로드" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => upload(e, 'photo')} /></label><span className="text-xs text-slate-500">JPG · PNG · WebP / 파일당 10MB / {selectedPhotos.length}장 선택</span></div>
        {!photos.length && <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-14 text-center"><Camera className="mx-auto mb-4 text-teal-700" size={34} /><p className="font-semibold">함께 찍은 사진으로 만남을 보여주세요</p><p className="mt-2 text-sm text-slate-500">두 사람이 나온 사진이나 미팅 현장 사진을 올려 주세요.</p></div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map(photo => {
          const selected = meeting.photoIds.includes(photo.id);
          const used = selected || records.some(r => r.photoIds.includes(photo.id));
          return <div key={photo.id} className={`overflow-hidden rounded-xl border-2 ${selected ? 'border-teal-600' : 'border-slate-200'}`}><button className="relative block w-full" aria-label={`${photo.name} ${selected ? '선택 해제' : '선택'}`} aria-pressed={selected} onClick={() => selectPhoto(photo.id)}><img src={urls[photo.id]} alt={photo.name} className="h-48 w-full object-cover" /><span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${selected ? 'bg-teal-700 text-white' : 'border bg-white'}`}>{selected && <Check size={15} />}</span></button><div className="space-y-3 p-3"><p className="truncate text-xs text-slate-600">{photo.name}</p><div className="flex items-center justify-between">{selected ? <button className="text-xs font-bold text-teal-800" onClick={() => patchMeeting({ coverId: photo.id })}>{meeting.coverId === photo.id ? '✓ 대표 사진' : '대표 사진으로 선택'}</button> : <span className="text-xs text-slate-400">미선택</span>}<button title={used ? '미팅에서 사용 중인 사진은 삭제할 수 없습니다.' : '사진 삭제'} aria-label={`${photo.name} 삭제`} disabled={used} onClick={() => removeAsset(photo.id)} className="p-1 text-slate-500 disabled:opacity-25"><Trash2 size={15} /></button></div></div></div>;
        })}</div>
      </Section>}
      {step === 2 && <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Section title="이번 만남에서 나눈 이야기" description="짧은 메모로 적어도 괜찮습니다. 양식에 있던 소개와 그날 실제 나눈 대화를 구분해 주세요.">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="미팅 날짜 *" type="date" value={meeting.date} onChange={v => patchMeeting({ date: v })} /><Field label="미팅 장소" value={meeting.place} onChange={v => patchMeeting({ place: v })} placeholder="장소명 또는 온라인" /></div>
          <Field label="대화의 중심 주제 *" value={meeting.topic} onChange={v => patchMeeting({ topic: v })} placeholder="예: 고객 상담 과정에서 신뢰를 쌓는 방법" />
          <Field label="실제로 어떤 이야기를 나눴나요? *" multiline rows={5} value={meeting.conversation} onChange={v => patchMeeting({ conversation: v })} placeholder="상대방의 경험, 내가 공유한 사례, 함께 이야기한 문제를 적어 주세요." />
          <Field label="내가 얻은 인사이트 *" multiline value={meeting.insight} onChange={v => patchMeeting({ insight: v })} placeholder="그 이야기가 왜 내 사업에 도움이 되었나요?" />
          <Field label="이번 글에서 알리고 싶은 내 전문성 *" multiline value={meeting.myPromotion} onChange={v => patchMeeting({ myPromotion: v })} />
          <Field label="소개하고 싶은 상대방의 전문성 *" multiline value={meeting.partnerPromotion} onChange={v => patchMeeting({ partnerPromotion: v })} />
          <Field label="서로 돕기로 한 일·다음 계획" multiline value={meeting.nextAction} onChange={v => patchMeeting({ nextAction: v })} hint="협업 가능성, 합의한 계획, 완료된 성과를 구분하세요. 정한 내용이 없으면 비워 두세요." />
        </Section>
        <aside className="h-fit rounded-2xl bg-[#eaf1ed] p-6"><BookOpen size={24} className="mb-4 text-teal-800" /><h2 className="font-bold">글을 읽을 미래의 고객에게</h2><p className="mt-3 text-sm leading-7 text-slate-600">우리는 각각 어떤 일을 하나요?<br />어떤 문제를 해결할 수 있나요?<br />이 만남에서 무엇을 배웠나요?<br />어떤 일로 연락하면 좋을까요?</p><p className="mt-5 border-t border-teal-800/15 pt-4 text-xs leading-6 text-slate-500">“유익한 시간이었습니다”에서 한 걸음 더 나아가, 구체적인 경험과 나의 생각을 남겨 보세요.</p></aside>
      </div>}
      {step === 3 && <Section title="두 사람을 함께 소개하는 글" description="기본 초안을 만들고 직접 다듬거나, 작성 프롬프트를 복사해 사용하는 AI에서 글을 작성한 뒤 본문에 붙여 넣으세요.">
        <div className="flex flex-wrap gap-2"><button className={primaryStyle} onClick={generate}><FileText size={16} />{meeting.body ? '기본 초안 다시 구성' : '기본 초안 구성'}</button><button disabled={missing.length > 0} className={buttonStyle} onClick={() => copy(makePrompt(profile, meeting))}><Copy size={16} />AI 작성 프롬프트 복사</button><button className={`${buttonStyle} ml-auto`} onClick={() => setPreview(!preview)}>{preview ? '편집하기' : '사진 포함 미리보기'}</button></div>
        <p className="text-xs leading-6 text-slate-500">기본 초안은 입력 내용을 정해진 구성으로 정리합니다. AI 호출은 하지 않습니다. {missing.length ? `아직 필요한 입력: ${missing.join(', ')}` : '필수 자료가 준비되었습니다.'}</p>
        {preview ? <article className="mx-auto max-w-2xl py-6"><h2 className="mb-6 text-3xl font-bold leading-snug">{meeting.title || '제목을 작성해 주세요'}</h2>{orderedPhotos[0] && <figure className="mb-8"><img src={urls[orderedPhotos[0].id]} alt={caption} className="max-h-[520px] w-full rounded-xl object-contain" /><figcaption className="mt-2 text-xs text-slate-500">{caption}</figcaption></figure>}<div className="whitespace-pre-wrap text-base leading-8">{meeting.body || '기본 초안을 구성하거나 본문을 입력해 주세요.'}</div>{orderedPhotos.slice(1).map(photo => <figure key={photo.id} className="mt-8"><img src={urls[photo.id]} alt={caption} className="max-h-[520px] w-full rounded-xl object-contain" /><figcaption className="mt-2 text-xs text-slate-500">{caption}</figcaption></figure>)}</article> : <><Field label="블로그 제목" value={meeting.title} onChange={v => patchMeeting({ title: v })} /><Field label="블로그 본문" multiline rows={22} value={meeting.body} onChange={v => patchMeeting({ body: v })} hint="외부 AI로 작성한 글도 여기에 붙여 넣고 수정할 수 있습니다." /></>}
        {!selectedPhotos.length && <p className="text-sm text-amber-800">사진 드라이브에서 이번 만남의 사진을 선택해 주세요.</p>}
        <button className={buttonStyle} onClick={archive}><Save size={16} />현재 미팅 보관</button>
      </Section>}
      {step === 4 && <div className="grid gap-6 lg:grid-cols-2">
        <Section title="확인하고 블로그에 남기기" description="사진과 글을 확인한 뒤 사용하는 블로그에서 직접 발행하세요. 발행 주소를 보관하면 다음 만남에서도 꺼내 볼 수 있습니다.">
          {[['facts', '실제 대화와 소개 정보가 맞고, 계획을 성과로 표현하지 않았습니다.'], ['disclosure', '상대방과 사진·이름·사업 정보의 공개 범위를 확인했습니다.'], ['both', '나와 상대방의 전문성, 문의 방법이 균형 있게 담겼습니다.']].map(([key, label]) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" checked={meeting.checks[key]} onChange={e => patchMeeting({ checks: { ...meeting.checks, [key]: e.target.checked } })} />{label}</label>)}
          <div className="flex flex-wrap gap-2"><button className={buttonStyle} disabled={!meeting.body.trim()} onClick={() => copy(`${meeting.title}\n\n${meeting.body}`)}><Copy size={16} />본문 복사</button><button className={buttonStyle} disabled={busy || !meeting.body.trim() || !meeting.title.trim()} onClick={exportHtml}><Download size={16} />사진 포함 HTML</button></div>
          <p className="text-xs leading-6 text-slate-500">HTML은 사진을 포함한 보관용 파일입니다. 블로그 편집기에는 본문을 붙여 넣고 선택한 사진을 직접 첨부하세요.</p>
          <div className="flex flex-wrap gap-2">{orderedPhotos.map((photo, i) => <button key={photo.id} className="text-xs text-teal-800 underline" onClick={() => saveFile(photo.file, photo.name)}>사진 {i + 1} 내려받기</button>)}</div>
          <Field label="발행한 블로그 주소" type="url" value={meeting.publishedUrl} onChange={v => patchMeeting({ publishedUrl: v, checks: meeting.checks })} placeholder="https://…" hint="실제로 발행한 글의 주소를 입력하세요. 자동 발행이나 게시 상태 검증은 하지 않습니다." />
          {meeting.publishedUrl && !safePublishedUrl(meeting.publishedUrl) && <p className="text-sm text-rose-700">http:// 또는 https://로 시작하는 올바른 주소를 입력해 주세요.</p>}
          <button className={primaryStyle} onClick={archive}><Save size={16} />{canComplete(meeting) ? '실습 완료 · 발행 기록 저장' : '작성 중으로 보관'}</button>
          <p className="text-xs text-slate-500">{!reviewed ? '확인 항목 3개를 체크해 주세요. ' : ''}{!selectedPhotos.length ? '미팅 사진이 필요합니다. ' : ''}{!canComplete(meeting) ? '제목·본문·사진·확인 항목·발행 주소가 갖춰지면 완료로 기록됩니다.' : '완료 조건이 모두 갖춰졌습니다.'}</p>
        </Section>
        <Section title="쌓여가는 사업 활동" description={`${records.length}개의 미팅 기록 · ${records.filter(canComplete).length}개의 발행 기록 (직접 등록)`}>
          <button className={buttonStyle} disabled={busy} onClick={() => { if (meeting.body || meeting.partner) archive(); setData(prev => ({ ...prev, meeting: newMeeting() })); setStep(0); setMessage('새 미팅을 시작합니다. 내 사업 자료와 사진 드라이브는 유지됩니다.'); }}><Plus size={16} />다음 원투원 작성</button>
          {!records.length && <p className="py-8 text-center text-sm text-slate-500">첫 번째 만남을 보관해 보세요.</p>}
          {records.map(record => <div key={record.id} className="border-b border-slate-100 pb-5"><p className="mb-2 flex items-center gap-2 text-xs text-teal-700">{canComplete(record) ? <CheckCircle2 size={14} /> : <FileText size={14} />}{canComplete(record) ? '발행 기록' : '작성 중'} · {record.date || '날짜 미입력'}</p><h3 className="font-semibold">{record.title || `${record.partner || '새 상대방'}님과의 원투원`}</h3><div className="mt-3 flex gap-4 text-xs"><button className="text-slate-600 underline" onClick={() => { const snapshot = { ...meeting, author: { ...profile }, savedAt: new Date().toISOString() }; setData(prev => ({ ...prev, records: meeting.id !== record.id && (meeting.partner || meeting.body) ? [snapshot, ...prev.records.filter(r => r.id !== meeting.id)] : prev.records, meeting: { ...record }, profile: { ...record.author } })); setStep(3); setMessage('저장된 미팅과 당시의 사업 정보를 불러왔습니다.'); }}>이어서 편집</button>{safePublishedUrl(record.publishedUrl) && <a className="text-teal-800 underline" href={safePublishedUrl(record.publishedUrl)} target="_blank" rel="noopener noreferrer">발행한 글 열기</a>}</div></div>)}
        </Section>
      </div>}
      <footer className="mt-7 flex items-center justify-between gap-3 pb-8"><button className={buttonStyle} disabled={step === 0} onClick={() => { setStep(step - 1); setError(''); setMessage(''); }}><ArrowLeft size={16} />이전</button><span className="text-xs text-slate-400">{step + 1} / {STEPS.length}</span><button className={primaryStyle} disabled={step === STEPS.length - 1} onClick={() => { setStep(step + 1); setError(''); setMessage(''); }}>다음<ArrowRight size={16} /></button></footer>
    </div>
  </div>;
}
