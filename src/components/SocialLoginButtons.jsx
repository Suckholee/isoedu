'use client';
import { useEffect, useState } from 'react';
import { dataConfig } from '../lib/dataConfig';
import { loadSocialProviders } from '../lib/socialAuth.mjs';
import { useAuth } from '../context/AuthContext';

export default function SocialLoginButtons({ link = false }) {
  const { loginSocial, linkSocial, user } = useAuth();
  const [providers, setProviders] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    loadSocialProviders(dataConfig).then(result => { if (active) setProviders(result); }).catch(() => {
      if (active) { setProviders({}); setError('소셜 로그인 설정을 확인하지 못했습니다. 이메일 로그인을 이용해 주세요.'); }
    });
    return () => { active = false; };
  }, []);
  async function start(provider) {
    setBusy(provider); setError('');
    try {
      const result = await (link ? linkSocial(provider) : loginSocial(provider));
      if (!result.success) setError(result.error);
    } catch { setError('로그인 연결 중 오류가 발생했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(null); }
  }
  return <div className="space-y-2">
    {link && <p className="text-xs text-slate-600 mb-3">기존 계정에 연결하면 회사·문서 권한을 그대로 사용합니다. 연결할 카카오·Google 계정은 다음 화면에서 직접 확인해 주세요.</p>}
    {['kakao', 'google'].map(provider => {
      const name = provider === 'kakao' ? '카카오' : 'Google';
      const linked = link && user?.identities?.some(identity => identity.provider === provider);
      return <button key={provider} type="button" disabled={!providers?.[provider] || Boolean(busy) || linked}
        onClick={() => start(provider)}
        className={`w-full min-h-11 py-3 px-4 rounded-xl border text-sm font-semibold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${provider === 'kakao' ? 'bg-[#FEE500] border-[#FEE500] text-[#191919]' : 'bg-white border-slate-300 text-slate-700'}`}>
        {busy === provider ? '연결 중…' : linked ? `${name} 연결됨` : `${name}${link ? ' 계정 연결' : '로 계속하기'}`}
        {!linked && !providers?.[provider] && <span className="ml-2 text-xs font-normal">{providers ? '설정 준비 중' : '확인 중'}</span>}
      </button>;
    })}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
  </div>;
}
