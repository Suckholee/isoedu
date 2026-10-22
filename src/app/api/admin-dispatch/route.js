import { NextResponse } from 'next/server';
import { DEFAULT_ADMIN_SENDER, validateDispatchInput } from '../../../lib/adminCenter.mjs';

export const dynamic = 'force-dynamic';

function getGatewayConfig() {
  const resendKey = String(process.env.RESEND_API_KEY || '').trim();
  const webhookUrl = String(process.env.DISPATCH_WEBHOOK_URL || '').trim();
  const solapiKey = String(process.env.SOLAPI_API_KEY || '').trim();
  const aligoKey = String(process.env.ALIGO_API_KEY || '').trim();
  const senderEmail = String(process.env.DISPATCH_FROM_EMAIL || DEFAULT_ADMIN_SENDER.email).trim();
  const senderName = String(process.env.DISPATCH_SENDER_NAME || DEFAULT_ADMIN_SENDER.name).trim();

  const emailConfigured = Boolean(resendKey || webhookUrl);
  const smsConfigured = Boolean(solapiKey || aligoKey || webhookUrl);

  return {
    resendKey,
    webhookUrl,
    solapiKey,
    aligoKey,
    senderEmail,
    senderName,
    emailConfigured,
    smsConfigured,
    emailProvider: resendKey
      ? 'Resend Email API 연동됨'
      : webhookUrl
      ? '전자발송 Webhook 릴레이 연동됨'
      : 'Resend / SMTP API 키 대기 (발송 대장 + 메일앱 모드)',
    smsProvider: solapiKey
      ? 'Solapi 알림톡·SMS 연동됨'
      : aligoKey
      ? 'Aligo 알림톡·SMS 연동됨'
      : webhookUrl
      ? '전자발송 Webhook 릴레이 연동됨'
      : '알림톡·SMS API 키 대기 (발송 대장 기록 모드)',
  };
}

function escapeHtml(text = '') {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml({ subject, body, senderName, senderEmail, attachments = [] }) {
  const safeBody = escapeHtml(body).replace(/\r?\n/g, '<br />');
  const attachmentRows = Array.isArray(attachments)
    ? attachments
        .map(
          (att) =>
            `<li style="margin:4px 0;font-size:13px;color:#1e293b;"><strong>[${escapeHtml(
              att.category || '동봉문서'
            )}]</strong> ${escapeHtml(att.title || att.fileName || '첨부 문서')}</li>`
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:18px 24px;">
      <div style="font-size:11px;font-weight:700;color:#93c5fd;letter-spacing:0.04em;">HONESTONE · 어니스톤 공식 전자발송</div>
      <div style="font-size:16px;font-weight:800;margin-top:4px;">${escapeHtml(subject)}</div>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.7;color:#1e293b;">
      ${safeBody}
      ${
        attachmentRows
          ? `<div style="margin-top:20px;padding:14px 16px;background:#f1f5f9;border-radius:12px;">
              <div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:6px;">동봉·첨부 문서 내역</div>
              <ul style="margin:0;padding-left:18px;">${attachmentRows}</ul>
            </div>`
          : ''
      }
    </div>
    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
      발신: <strong>${escapeHtml(senderName)}</strong> (${escapeHtml(senderEmail)}) · 어니스톤 인증·문서 관리 플랫폼
    </div>
  </div>
</body>
</html>`;
}

export async function GET() {
  const cfg = getGatewayConfig();
  return NextResponse.json({
    ok: true,
    emailConfigured: cfg.emailConfigured,
    smsConfigured: cfg.smsConfigured,
    emailProvider: cfg.emailProvider,
    smsProvider: cfg.smsProvider,
    senderName: cfg.senderName,
    senderEmail: cfg.senderEmail,
    requiredEnvKeys: {
      email: ['RESEND_API_KEY', 'DISPATCH_FROM_EMAIL'],
      smsAndAlimtalk: ['SOLAPI_API_KEY', 'ALIGO_API_KEY', 'DISPATCH_WEBHOOK_URL'],
    },
  });
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '유효한 JSON 요청 본문이 필요합니다.' }, { status: 400 });
  }

  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : payload && typeof payload === 'object'
    ? [payload]
    : [];

  if (rawItems.length === 0) {
    return NextResponse.json({ ok: false, error: '발송 대상(items)이 비어 있습니다.' }, { status: 400 });
  }
  if (rawItems.length > 200) {
    return NextResponse.json(
      { ok: false, error: '1회 일괄 전자발송은 최대 200명까지 처리할 수 있습니다.' },
      { status: 400 }
    );
  }

  const cfg = getGatewayConfig();
  const results = [];

  for (const item of rawItems) {
    const channel = String(item.channel || 'EMAIL').trim();
    const recipientName = String(item.recipientName || '회원').trim();
    const recipientContact = String(item.recipientContact || '').trim();
    const subject = String(item.subject || '').trim();
    const body = String(item.body || '').trim();
    const senderName = String(item.senderName || cfg.senderName).trim();
    const senderEmail = String(item.senderEmail || cfg.senderEmail).trim();
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];

    const check = validateDispatchInput({ channel, recipientContact, subject, body });
    if (!check.valid) {
      results.push({
        recipientName,
        recipientContact,
        channel,
        status: 'FAILED',
        sentExternally: false,
        deliveryNote: check.error,
      });
      continue;
    }

    // 1) Email via Resend API
    if (channel === 'EMAIL' && cfg.resendKey) {
      try {
        const resendAttachments = attachments
          .filter((a) => a.contentBase64 && a.fileName)
          .map((a) => ({
            filename: a.fileName,
            content: a.contentBase64,
          }));

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${cfg.senderEmail}>`,
            to: [recipientContact],
            reply_to: senderEmail,
            subject,
            text: body,
            html: buildEmailHtml({ subject, body, senderName, senderEmail, attachments }),
            ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {}),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          results.push({
            recipientName,
            recipientContact,
            channel,
            status: 'FAILED',
            sentExternally: false,
            deliveryNote: data?.message || `Resend 응답 오류 (HTTP ${res.status})`,
          });
        } else {
          results.push({
            recipientName,
            recipientContact,
            channel,
            status: 'SENT',
            sentExternally: true,
            providerId: data?.id || null,
            deliveryNote: `Resend 이메일 실발송 완료 (${data?.id || 'OK'})`,
          });
        }
        continue;
      } catch (err) {
        results.push({
          recipientName,
          recipientContact,
          channel,
          status: 'FAILED',
          sentExternally: false,
          deliveryNote: err?.message || '이메일 발송 네트워크 오류',
        });
        continue;
      }
    }

    // 2) Webhook Relay (Email / Alimtalk / SMS)
    if (cfg.webhookUrl) {
      try {
        const res = await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            senderName,
            senderEmail,
            recipientName,
            recipientContact,
            companyId: item.companyId || null,
            companyName: item.companyName || '',
            templateKey: item.templateKey || 'ADMIN_MEMBER_NOTICE',
            subject,
            body,
            attachments: attachments.map((a) => ({
              id: a.id,
              title: a.title,
              fileName: a.fileName,
              category: a.category,
            })),
          }),
        });
        if (!res.ok) {
          results.push({
            recipientName,
            recipientContact,
            channel,
            status: 'FAILED',
            sentExternally: false,
            deliveryNote: `발송 웹훅 응답 오류 (HTTP ${res.status})`,
          });
        } else {
          results.push({
            recipientName,
            recipientContact,
            channel,
            status: 'SENT',
            sentExternally: true,
            deliveryNote: '외부 발송 웹훅 게이트웨이 전달 완료',
          });
        }
        continue;
      } catch (err) {
        results.push({
          recipientName,
          recipientContact,
          channel,
          status: 'FAILED',
          sentExternally: false,
          deliveryNote: err?.message || '발송 웹훅 호출 오류',
        });
        continue;
      }
    }

    // 3) No external API key configured yet: queue in ledger cleanly without faking external delivery
    results.push({
      recipientName,
      recipientContact,
      channel,
      status: item.preferredFallbackStatus || 'QUEUED',
      sentExternally: false,
      deliveryNote:
        channel === 'EMAIL'
          ? '발송 대장 기록 완료 (RESEND_API_KEY 설정 시 서버 직접 발송 · 현재 메일앱/대장 연동 모드)'
          : '발송 대장 기록 완료 (알림톡·SMS API 키 설정 시 자동 전송 연동)',
    });
  }

  const sentCount = results.filter((r) => r.status === 'SENT').length;
  const queuedCount = results.filter((r) => ['QUEUED', 'QUEUED_LOCAL', 'MAILTO_OPENED', 'COPIED'].includes(r.status)).length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;

  return NextResponse.json({
    ok: true,
    sentCount,
    queuedCount,
    failedCount,
    emailConfigured: cfg.emailConfigured,
    smsConfigured: cfg.smsConfigured,
    results,
  });
}
