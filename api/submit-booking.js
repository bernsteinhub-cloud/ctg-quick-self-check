/**
 * Vercel Serverless Function — Booking Form Handler
 * Accepts: company, name, email, preferredTime
 * Sends notification email via Resend.
 */

const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { company, name, email, preferredTime } = req.body || {};

    if (!company || !name || !email || !email.includes('@')) {
      return res.status(400).json({ error: '请填写所有必填字段（公司名称、联系人姓名、邮箱）' });
    }

    const notifyEmail = process.env.NOTIFY_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const submittedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    console.log(`[CTG Booking] ${name} (${company}) — ${email} — ${preferredTime || '未指定'} — ${submittedAt}`);

    if (resendApiKey && notifyEmail) {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: 'CTG Quick Self-Check <onboarding@resend.dev>',
        to: notifyEmail,
        subject: `[CTG 预约] ${name} · ${company} — 15分钟诊断对话`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1e3a5f; margin-bottom: 8px;">📅 CTG · 新预约请求</h2>
            <p style="color: #5f6b7a; font-size: 14px; margin-bottom: 24px;">${submittedAt}</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1d28;">🏢 公司名称</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1d28;">👤 联系人</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1d28;">📧 邮箱</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #1e3a5f;">
                  <a href="mailto:${email}" style="color: #1e3a5f;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #1a1d28;">🕐 计划时间</td>
                <td style="padding: 12px 16px;">${preferredTime || '未指定'}</td>
              </tr>
            </table>

            <a href="mailto:${email}?subject=Re: CTG 诊断对话预约&body=${encodeURIComponent(name + ' 您好，\\n\\n感谢预约CTG差旅治理诊断对话。以下时间您方便吗？\\n\\n期待与您交流。')}" style="display: inline-block; padding: 12px 28px; background: #1e3a5f; color: #fff; text-decoration: none; border-radius: 100px; font-weight: 600; margin-right: 12px;">
              ✉️ 回复确认
            </a>

            <p style="margin-top: 32px; font-size: 11px; color: #aaa;">
              此邮件由 CTG Quick Self-Check 自动发送。
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('[CTG Booking] Resend error:', JSON.stringify(error));
      } else {
        console.log(`[CTG Booking] Notification sent (id: ${data?.id})`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[CTG Booking] Error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
