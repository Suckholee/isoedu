'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, recordAuditLog } from '../lib/supabaseClient';
import { isCloudMode } from '../lib/dataConfig.js';
import { INITIAL_COMPANIES } from '../lib/mockData';

const AuthContext = createContext(null);

const DEMO_PROFILES = {
  ADMIN: {
    id: 'demo-admin-01',
    email: 'admin@isoedu.kr',
    fullName: '홍준호',
    title: '선임연구원 / 공인 최고심사관',
    role: 'ADMIN',
    company: INITIAL_COMPANIES[0],
    securityLevel: 'Level 5 (최고관리자)',
    mfaEnabled: true
  },
  AUDITOR: {
    id: 'demo-auditor-02',
    email: 'auditor.kim@kab.or.kr',
    fullName: '김성우',
    title: 'KAB 공인 인증심사원',
    role: 'AUDITOR',
    company: INITIAL_COMPANIES[0],
    securityLevel: 'Level 4 (전문심사원)',
    mfaEnabled: true
  },
  MEMBER: {
    id: 'demo-member-03',
    email: 'qa@hitech.co.kr',
    fullName: '이지현',
    title: '품질보증팀 실무담당자',
    role: 'MEMBER',
    company: INITIAL_COMPANIES[0],
    securityLevel: 'Level 2 (기업실무자)',
    mfaEnabled: false
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(isCloudMode ? null : DEMO_PROFILES.ADMIN);
  const [isLoading, setIsLoading] = useState(isCloudMode);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isCloudMode) return;
    if (!supabase) {
      setAuthError('Supabase 연결 설정을 확인해 주세요.');
      setIsLoading(false);
      return;
    }
    let mounted = true;
    let generation = 0;
    let activeUserId = null;
    async function syncSession(session) {
      if (!mounted) return;
      if (session?.user?.id && session.user.id === activeUserId) {
        setUser(session.user);
        return;
      }
      activeUserId = session?.user?.id || null;
      const current = ++generation;
      setUser(session?.user || null);
      setProfile(null);
      setAuthError(null);
      setIsLoading(Boolean(session?.user));
      if (!session?.user) return;
      try {
        const { data, error } = await supabase.from('profiles')
          .select('*, company:companies(*)').eq('id', session.user.id).single();
        if (error) throw error;
        if (!mounted || generation !== current) return;
        setProfile({
          id: data.id, email: data.email, fullName: data.full_name, role: data.role,
          company: data.company, title: { ADMIN: '최고관리자', AUDITOR: '공인심사원', MEMBER: '기업실무자' }[data.role],
          securityLevel: { ADMIN: 'Level 5', AUDITOR: 'Level 4', MEMBER: 'Level 2' }[data.role],
          mfaEnabled: session.user.factors?.some(factor => factor.status === 'verified') || false,
        });
      } catch (err) {
        if (mounted && generation === current) setAuthError(`프로필을 불러오지 못했습니다: ${err.message}`);
      } finally {
        if (mounted && generation === current) setIsLoading(false);
      }
    }
    // Run database requests outside Supabase's auth event lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (mounted) syncSession(session); }, 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) { setAuthError(error.message); setIsLoading(false); return; }
      if (generation === 0) syncSession(data.session);
    }).catch(err => { if (mounted) { setAuthError(err.message); setIsLoading(false); } });
    return () => { mounted = false; generation++; subscription.unsubscribe(); };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    if (isCloudMode) {
      if (!supabase) return { success: false, error: 'Supabase 연결 설정을 확인해 주세요.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); return { success: false, error: error.message }; }
      recordAuditLog({ actionType: 'LOGIN' }).catch(err => setAuthError(`로그인 감사 기록 실패: ${err.message}`));
      return { success: true };
    }
    const demo = Object.values(DEMO_PROFILES).find(p => p.email.toLowerCase() === email.toLowerCase())
      || { ...DEMO_PROFILES.MEMBER, email, fullName: email.split('@')[0] };
    setProfile(demo);
    setUser({ id: demo.id, email });
    return { success: true };
  };

  const signup = async ({ email, password, fullName, companyName = '' }) => {
    if (!isCloudMode) return login(email, password);
    if (!supabase) return { success: false, error: 'Supabase 연결 설정을 확인해 주세요.' };
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, company_name: companyName } },
    });
    return error ? { success: false, error: error.message }
      : { success: true, needsConfirmation: !data.session };
  };

  const logout = async () => {
    if (isCloudMode && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) { setAuthError(error.message); return; }
    }
    setUser(null);
    setProfile(null);
  };

  const switchDemoRole = role => {
    if (isCloudMode || !DEMO_PROFILES[role]) return;
    setProfile(DEMO_PROFILES[role]);
    setUser({ id: DEMO_PROFILES[role].id, email: DEMO_PROFILES[role].email });
  };

  return <AuthContext.Provider value={{
    user, profile, isLoading, authError, isDemoMode: !isCloudMode,
    isAuthenticated: isCloudMode ? Boolean(user) : Boolean(profile),
    isAdmin: profile?.role === 'ADMIN', isAuditor: ['ADMIN', 'AUDITOR'].includes(profile?.role),
    isMember: profile?.role === 'MEMBER', login, signup, logout, switchDemoRole,
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
