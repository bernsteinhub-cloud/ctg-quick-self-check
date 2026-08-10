/**
 * Vercel Serverless Function — Email Submission Handler
 *
 * Required env vars:
 *   RESEND_API_KEY  — API key from https://resend.com
 *   NOTIFY_EMAIL    — Where notification emails are sent
 */

const { Resend } = require('resend');

const RESULT_LABELS = {
  governance_behind: '⚠️ Governance Behind / 治理落后于业务',
  tool_ahead: '🔧 Tool Ahead / 工具领先于治理',
  vision_ahead: '💡 Vision Ahead / 认知领先于执行',
  aligned_foundational: '✓ Aligned · Foundational / 基础阶段匹配',
  aligned_mature: '✓ Aligned · Mature / 治理与业务同步',
  governance_ahead: 'ℹ️ Governance Ahead / 治理领先于业务',
};

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, resultKey, headline, body, badge, answersDetail, scores } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const notifyEmail = process.env.NOTIFY_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const resultLabel = RESULT_LABELS[resultKey] || resultKey;
    const submittedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    console.log(`[CTG Lead] ${email} — ${resultLabel} — ${submittedAt}`);

    // Build answers table rows
    let answersHtml = '';
    if (answersDetail && Array.isArray(answersDetail)) {
      answersHtml = answersDetail.map((a, i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#5f6b7a;vertical-align:top;white-space:nowrap">${i + 1}.</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#1a1d28;vertical-align:top">${esc(a.question)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#1e3a5f;font-weight:600;vertical-align:top">${esc(a.answer)}</td>
        </tr>
      `).join('');
    }

    // Scores row
    let scoresHtml = '';
    if (scores) {
      scoresHtml = `
        <tr><td colspan="3" style="padding:8px 12px;font-size:11px;color:#aaa">
          Internal: Context=${scores.context} | Cognition=${scores.cognition} | Capability=${scores.capability} | Current=${scores.current}
        </td></tr>
      `;
    }

    if (resendApiKey && notifyEmail) {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: 'CTG Quick Self-Check <onboarding@resend.dev>',
        to: notifyEmail,
        subject: `[CTG 新线索] ${email} — ${resultLabel}`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;max-width:600px;margin:0 auto;padding:28px 20px;background:#fff">

  <!-- Header -->
  <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:20px 24px;margin:-28px -20px 0">
    <h2 style="color:#fff;margin:0;font-size:18px">📋 CTG Quick Self-Check · 新提交</h2>
    <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:12px">${submittedAt}</p>
  </div>

  <!-- Client + Result -->
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr>
      <td style="padding:10px 16px;background:#f7f8fa;border-radius:8px 0 0 8px;font-weight:600;color:#5f6b7a;font-size:13px;width:80px">📧 客户邮箱</td>
      <td style="padding:10px 16px;background:#f7f8fa;border-radius:0 8px 8px 0;font-size:14px">
        <a href="mailto:${esc(email)}" style="color:#1e3a5f;text-decoration:none">${esc(email)}</a>
      </td>
    </tr>
  </table>

  <!-- Result Badge -->
  <div style="display:inline-block;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:600;background:#fdf2f2;color:#c0392b;margin-bottom:12px">${esc(badge || resultLabel)}</div>

  <!-- Headline -->
  <div style="font-size:18px;font-weight:700;color:#1e3a5f;line-height:1.5;margin-bottom:10px">${headline || ''}</div>

  <!-- Body -->
  <div style="font-size:14px;color:#5f6b7a;line-height:1.8;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #eee">${body || ''}</div>

  <!-- Answers Table -->
  <h3 style="font-size:15px;color:#1a1d28;margin-bottom:10px">📝 客户答题明细</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
    <tr style="background:#f7f8fa">
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#5f6b7a;border-bottom:2px solid #e2e6ed">#</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#5f6b7a;border-bottom:2px solid #e2e6ed">Question</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#5f6b7a;border-bottom:2px solid #e2e6ed">Answer</td>
    </tr>
    ${answersHtml}
    ${scoresHtml}
  </table>

  <!-- CTA -->
  <a href="mailto:${esc(email)}?subject=Re:%20CTG%20差旅治理诊断" style="display:inline-block;padding:12px 28px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;margin-top:8px">✉️ 回复该客户</a>

  <p style="margin-top:28px;font-size:11px;color:#aaa;text-align:center">此邮件由 CTG Quick Self-Check 自动发送。回复将直接发送给客户。</p>
</div>`,
      });

      if (error) {
        console.error('[CTG Lead] Resend error:', JSON.stringify(error));
        return res.status(200).json({ success: true, warning: 'Email queued but may not deliver' });
      }

      console.log(`[CTG Lead] Notification sent to ${notifyEmail} (id: ${data?.id})`);
    } else {
      console.log('[CTG Lead] Email notification skipped (env vars not set)');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[CTG Lead] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
