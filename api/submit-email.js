/**
 * Vercel Serverless Function — Email Submission Handler
 *
 * Required environment variables:
 *   RESEND_API_KEY  — API key from https://resend.com (free tier: 100 emails/day)
 *   NOTIFY_EMAIL    — Where notification emails are sent (your email address)
 */

const { Resend } = require('resend');

// Result labels for human-readable notification
const RESULT_LABELS = {
  governance_behind: '⚠️ 治理落后于业务',
  tool_ahead: '🔧 工具领先于治理',
  vision_ahead: '💡 认知领先于执行',
  aligned_foundational: '✓ 治理与业务基本匹配 (基础阶段)',
  aligned_mature: '✓ 治理与业务同步 (成熟阶段)',
  governance_ahead: 'ℹ️ 治理领先于业务',
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, resultKey, headline } = req.body || {};

    // Validate
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!resultKey || !headline) {
      return res.status(400).json({ error: 'Missing result data' });
    }

    const notifyEmail = process.env.NOTIFY_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    const resultLabel = RESULT_LABELS[resultKey] || resultKey;
    const submittedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // Always log the submission (visible in Vercel Function Logs)
    console.log(`[CTG Lead] ${email} — ${resultLabel} — ${submittedAt}`);

    // Send notification email if Resend is configured
    if (resendApiKey && notifyEmail) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: 'CTG Quick Self-Check <noreply@ctg-check.yourdomain.com>',
        to: notifyEmail,
        subject: `[CTG 新线索] ${email} — ${resultLabel}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1e3a5f; margin-bottom: 8px;">📋 CTG Quick Self-Check · 新提交</h2>
            <p style="color: #5f6b7a; font-size: 14px; margin-bottom: 24px;">${submittedAt}</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1d28;">📧 邮箱</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #1e3a5f;">
                  <a href="mailto:${email}" style="color: #1e3a5f;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1d28;">🏷️ 诊断结果</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${resultLabel}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #1a1d28;">💬 判断句</td>
                <td style="padding: 12px 16px; font-size: 15px; color: #1a1d28; font-style: italic;">${headline}</td>
              </tr>
            </table>

            <a href="mailto:${email}?subject=Re: CTG 差旅治理诊断" style="display: inline-block; padding: 12px 28px; background: #1e3a5f; color: #fff; text-decoration: none; border-radius: 100px; font-weight: 600;">
              ✉️ 回复该客户
            </a>

            <p style="margin-top: 32px; font-size: 11px; color: #aaa;">
              此邮件由 CTG Quick Self-Check 自动发送。回复将直接发送给客户。
            </p>
          </div>
        `,
      });

      console.log(`[CTG Lead] Notification sent to ${notifyEmail}`);
    } else {
      console.log('[CTG Lead] Email notification skipped (RESEND_API_KEY or NOTIFY_EMAIL not set)');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[CTG Lead] Error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
