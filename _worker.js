/**
 * 众水不灭 · 雅歌之印 (Love Universe SaaS Engine)
 * 文件名: _worker.js
 * 架构: 单源多租户路由、云端 Cron 定时巡检、Resend 浪漫邮件推送引擎、农历公历对齐计算、破冰信号状态机、多源流式音频转发、严格独立鉴权、HMAC 授权验证
 */

// 1900 - 2100 年农历 24-bit 二进制天文压缩数据表 (紫金山天文台标准)
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x1af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096e5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

const CN_MONTHS = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const CN_DAYS = [
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
];

// 云端农历转换工具函数
function getLunarLeapMonth(year) {
  if (year < 1900 || year > 2100) return 0;
  return LUNAR_INFO[year - 1900] & 0xf;
}

function getLunarLeapDays(year) {
  if (getLunarLeapMonth(year) === 0) return 0;
  return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
}

function getLunarMonthDays(year, month) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return 30;
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function getLunarYearDays(year) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLunarLeapDays(year);
}

function workerLunarToSolar(lYear, lMonth, lDay, isLeap = false) {
  if (lYear < 1900 || lYear > 2100) return null;
  const leapMonth = getLunarLeapMonth(lYear);
  if (isLeap && leapMonth !== lMonth) isLeap = false;

  let offset = 0;
  for (let y = 1900; y < lYear; y++) offset += getLunarYearDays(y);
  for (let m = 1; m < lMonth; m++) {
    offset += getLunarMonthDays(lYear, m);
    if (leapMonth === m) offset += getLunarLeapDays(lYear);
  }
  if (isLeap) offset += getLunarMonthDays(lYear, lMonth);
  offset += (lDay - 1);

  const baseDate = new Date(Date.UTC(1900, 0, 31));
  const targetTime = baseDate.getTime() + offset * 86400000;
  const targetDate = new Date(targetTime);

  return {
    year: targetDate.getUTCFullYear(),
    month: targetDate.getUTCMonth() + 1,
    day: targetDate.getUTCDate(),
    dateStr: `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, "0")}-${String(targetDate.getUTCDate()).padStart(2, "0")}`
  };
}

function parseDateParts(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = String(dateStr).trim().split(/[ T]/)[0];
  const parts = clean.split(/[-/.]/).map(n => parseInt(n, 10));
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

// 统一邮件 HTML 模板合成引擎
function buildRomanticEmailHtml({ siteTitle, boyName, girlName, eventTitle, daysText, dateMeta, memo, hostUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${eventTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #ffffff;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background: #0f172a; border-radius: 20px; border: 1.5px solid rgba(245, 158, 11, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
        <tr>
          <td style="padding: 30px 24px 20px 24px; text-align: center; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(244, 63, 94, 0.15) 100%); border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #fde68a; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); padding: 3px 12px; border-radius: 20px; margin-bottom: 12px;">✨ THE SACRED COVENANT ✨</div>
            <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; color: #ffffff;">${boyName} & ${girlName}</h1>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">${siteTitle || "众水不能熄灭爱情，大水不能淹没 · 一生一世的契约"}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 24px;">
            <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; padding: 22px 18px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 13px; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 6px;">💌 恒久契约 · 专属提醒</span>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; color: #fde68a;">${eventTitle}</h2>
              <div style="font-size: 42px; font-weight: 900; font-family: ui-monospace, monospace; color: #f43f5e; line-height: 1.2; margin-bottom: 6px;">${daysText}</div>
              <span style="font-size: 12px; color: #38bdf8; font-family: ui-monospace, monospace;">${dateMeta}</span>
            </div>

            ${memo ? `
              <div style="background: #fffdfa; border: 1.5px dashed rgba(244, 63, 94, 0.4); border-radius: 14px; padding: 16px; margin-bottom: 24px; color: #374151;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.7; font-style: italic; font-weight: 600;">“ ${memo} ”</p>
              </div>
            ` : ""}

            <div style="text-align: center; margin-top: 10px;">
              <a href="${hostUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 28px; border-radius: 25px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);">🌟 进入我们的专属时空</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(3, 7, 18, 0.4);">
            <p style="margin: 0; font-size: 11px; color: #64748b;">众水不能熄灭爱情，大水不能淹没 · LOVE UNIVERSE</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// 统一 Resend API 邮件发送函数
async function sendResendEmail({ apiKey, fromEmail, toEmails, subject, htmlContent }) {
  if (!apiKey || !toEmails || toEmails.length === 0) return { success: false, error: "缺少发信参数" };

  const validRecipients = toEmails.filter(e => e && typeof e === "string" && e.includes("@"));
  if (validRecipients.length === 0) return { success: false, error: "收件人邮箱无效" };

  const sender = fromEmail && fromEmail.includes("@") ? fromEmail : "雅歌之印 <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: validRecipients,
        subject: subject,
        html: htmlContent
      })
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return { success: true, id: data.id };
    }
    return { success: false, error: data.message || JSON.stringify(data) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default {
  // ================= 1. Cloudflare Cron 定时巡检处理器 =================
  async scheduled(event, env, ctx) {
    const bucket = env.R2 || env.BUCKET || env.PAN || env.MY_BUCKET || env.FILE_BUCKET;
    if (!bucket) return;

    // 强制构建东八区北京时间 (UTC+8)
    const nowBJT = new Date(Date.now() + 8 * 3600 * 1000);
    const bjtYear = nowBJT.getUTCFullYear();
    const bjtMonth = nowBJT.getUTCMonth() + 1;
    const bjtDay = nowBJT.getUTCDate();
    const todayMidnightUTC = Date.UTC(bjtYear, bjtMonth - 1, bjtDay);

    // 遍历 R2 中的所有租户配置文件
    const listed = await bucket.list({ prefix: "" });
    const configKeys = listed.objects.map(o => o.key).filter(k => k.endsWith("/config.json") || k === "config.json");

    for (const cfgKey of configKeys) {
      try {
        const tenantDir = cfgKey.includes("/") ? cfgKey.split("/")[0] : "default";
        const signalsKey = `${tenantDir}/signals.json`;

        const cfgObj = await bucket.get(cfgKey);
        if (!cfgObj) continue;
        const config = JSON.parse(await cfgObj.text());

        const reminderCfg = config.reminder || {};
        if (reminderCfg.enabled === false || !reminderCfg.resendApiKey) continue;

        const boyEmail = reminderCfg.boyEmail?.trim();
        const girlEmail = reminderCfg.girlEmail?.trim();
        const recipients = [boyEmail, girlEmail].filter(Boolean);
        if (recipients.length === 0) continue;

        const advanceDays = Array.isArray(reminderCfg.advanceDays) && reminderCfg.advanceDays.length > 0 
          ? reminderCfg.advanceDays 
          : [7, 3, 1, 0];

        // 读取信号与发信锁字典
        let signalData = { reminderLog: {} };
        try {
          const sObj = await bucket.get(signalsKey);
          if (sObj) signalData = JSON.parse(await sObj.text());
        } catch (_) {}
        if (!signalData.reminderLog) signalData.reminderLog = {};

        const anniversaries = Array.isArray(config.anniversaries) ? config.anniversaries : [];
        let hasNewSentLock = false;

        for (const item of anniversaries) {
          if (!item || !item.date) continue;
          const p = parseDateParts(item.date);
          if (!p) continue;

          const isLunar = Boolean(item.isLunar);
          const isAnnual = item.type === "countdown" || Boolean(item.annualRepeat);
          const isLeap = Boolean(item.isLeapMonth);

          let targetSolar = null;
          if (isAnnual) {
            let thisYearSolar = isLunar 
              ? workerLunarToSolar(bjtYear, p.month, p.day, isLeap) 
              : { year: bjtYear, month: p.month, day: p.day };
            let nextYearSolar = isLunar 
              ? workerLunarToSolar(bjtYear + 1, p.month, p.day, isLeap) 
              : { year: bjtYear + 1, month: p.month, day: p.day };

            if (!thisYearSolar) continue;
            const thisYearTime = Date.UTC(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
            const nextYearTime = nextYearSolar ? Date.UTC(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day) : thisYearTime;

            targetSolar = (todayMidnightUTC <= thisYearTime) ? thisYearSolar : nextYearSolar;
          } else {
            targetSolar = { year: p.year, month: p.month, day: p.day };
          }

          if (!targetSolar) continue;
          const targetTime = Date.UTC(targetSolar.year, targetSolar.month - 1, targetSolar.day);
          const diffDays = Math.round((targetTime - todayMidnightUTC) / 86400000);

          // 判定是否命中提醒天数策略 (如 7天、3天、1天、0天)
          if (advanceDays.includes(diffDays) && diffDays >= 0) {
            const lockKey = `lock_${item.id || item.title}_${targetSolar.year}_d${diffDays}`;
            if (signalData.reminderLog[lockKey]) {
              continue; // 幂等防刷：已发送过直接跳过
            }

            let daysText = diffDays === 0 ? "🎉 正是今天" : `还剩 ${diffDays} 天`;
            let subject = diffDays === 0 
              ? `🎉【今日纪念日】${item.title || "契约纪念日"} · 愿爱永不止息`
              : `💌【纪念日倒数】距离 ${item.title || "契约纪念日"} 仅剩 ${diffDays} 天！`;

            const dateMeta = isLunar 
              ? `目标公历: ${targetSolar.year}-${String(targetSolar.month).padStart(2, "0")}-${String(targetSolar.day).padStart(2, "0")} (农历${isLeap ? "闰" : ""}${CN_MONTHS[p.month - 1] || p.month}月${CN_DAYS[p.day - 1] || p.day})`
              : `目标日期: ${targetSolar.year}-${String(targetSolar.month).padStart(2, "0")}-${String(targetSolar.day).padStart(2, "0")}`;

            const hostUrl = `https://${tenantDir.replace(/_/g, ".")}`;
            const emailHtml = buildRomanticEmailHtml({
              siteTitle: config.meta?.siteTitle,
              boyName: config.meta?.boyName || "良人",
              girlName: config.meta?.girlName || "佳偶",
              eventTitle: `${item.icon || "💖"} ${item.title || "契约纪念日"}`,
              daysText,
              dateMeta,
              memo: item.memo || "",
              hostUrl
            });

            const sendRes = await sendResendEmail({
              apiKey: reminderCfg.resendApiKey,
              fromEmail: reminderCfg.senderEmail,
              toEmails: recipients,
              subject,
              htmlContent: emailHtml
            });

            if (sendRes.success) {
              signalData.reminderLog[lockKey] = {
                sentAt: new Date().toISOString(),
                recipients,
                diffDays
              };
              hasNewSentLock = true;
            }
          }
        }

        if (hasNewSentLock) {
          await bucket.put(signalsKey, JSON.stringify(signalData, null, 2), {
            httpMetadata: { contentType: "application/json; charset=utf-8" }
          });
        }
      } catch (_) {}
    }
  },

  // ================= 2. 全站 HTTP 路由分发 =================
  async fetch(request, env) {
    const url = new URL(request.url);
    const bucket = env.R2 || env.BUCKET || env.PAN || env.MY_BUCKET || env.FILE_BUCKET;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-auth, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }

    const rawHost = (url.hostname || "default.local").toLowerCase();
    const tenantDir = rawHost.replace(/[^a-z0-9.-]/g, "_");
    const CONFIG_KEY = `${tenantDir}/config.json`;
    const SIGNALS_KEY = `${tenantDir}/signals.json`;

    const ADMIN_PASSWORD = String(env.ADMIN_PASSWORD || env.SECRET_PWD || env.ADMIN_PWD || "521").trim();
    const MASTER_LICENSE_SECRET = String(env.MASTER_LICENSE_SECRET || "SACRED_UNQUENCHABLE_LOVE_2026_KEY").trim();

    async function verifyAdminAuth(req) {
      const headerAuth = req.headers.get("x-admin-auth") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      const queryAuth = url.searchParams.get("auth");
      const token = (headerAuth || queryAuth || "").trim();

      if (!token) return false;

      if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== "521" && token === String(env.ADMIN_PASSWORD).trim()) {
        return true;
      }

      if (bucket) {
        try {
          const obj = await bucket.get(CONFIG_KEY);
          if (obj) {
            const cfg = JSON.parse(await obj.text());
            if (cfg.adminSecurity && cfg.adminSecurity.password) {
              return token === String(cfg.adminSecurity.password).trim();
            }
          }
        } catch (_) {}
      }

      return token === "521" || token === ADMIN_PASSWORD;
    }

    function sanitizeSanctity(contentString) {
      const profanityRegex = /(约炮|包养|出轨|偷情|小三|色情|裸聊|淫秽|性交|做爱|操你|傻逼|贱人|去死|滚蛋|妓女|嫖娼|嫖客|大保健|开房|一夜情)/i;
      return !profanityRegex.test(contentString);
    }

    function getStageSafeContent(stage, actionType, userCustomText) {
      const standardDict = {
        dating: {
          calm_down: "我有些情绪，需要安静片刻，但请放心，我不会走开，待会儿通个电话好吗？",
          break_ice: "今天天气很好，我们不吵了好不好？待会儿一起去散散步。",
          apology: "刚才是我态度不好、太急躁了，对不起，我愿意安静听你的感受。",
          miss_you: "即使有分歧，我心里依然全是你，想念你的笑容。",
          warm_hug: "隔空送你一朵云朵拥抱和一杯热可可，不要再生气啦。"
        },
        engaged: {
          calm_down: "筹备有些心力交瘁，我们先冷静下来，喝杯咖啡，别伤了彼此的初心。",
          break_ice: "比起眼前的分歧，我们的约定更珍贵。今晚开个视频对齐想法好吗？",
          apology: "我对不起你，刚才把现实的焦虑迁怒到了你身上，我向你道歉。",
          miss_you: "我们是一体的，无论面对多大挑战，我都坚定选择与你同行。",
          warm_hug: "再多繁杂的事情我们一起扛，别怕，有我在你身边。"
        },
        married: {
          calm_down: "我先在书房安静一会儿，不可含怒到日落，待会儿就出来抱你。",
          break_ice: "家是讲爱的地方不是讲理的地方。厨房有切好的水果和温水，我们谈谈心。",
          apology: "在这个家里你才是最重要的，我放下我的固执，对不起，过来抱一下。",
          miss_you: "柴米油盐是你，风花雪月也是你，执子之手，与子偕老。",
          warm_hug: "风雨再大，这里永远是你的避风港，我一直在。"
        }
      };

      const validStage = ["dating", "engaged", "married"].includes(stage) ? stage : "dating";
      const validAction = ["calm_down", "break_ice", "apology", "miss_you", "warm_hug"].includes(actionType) ? actionType : "break_ice";
      const fallback = standardDict[validStage][validAction];

      if (userCustomText && typeof userCustomText === "string" && userCustomText.trim().length > 0) {
        const text = userCustomText.trim().slice(0, 150);
        if (validStage === "dating") {
          const forbiddenDatingRegex = /(同居|睡觉|同房|开房|上床|床头|我家|你家|家里|做饭|切水果|洗碗|家务|同睡|书房)/i;
          if (forbiddenDatingRegex.test(text)) return fallback;
        }
        return text;
      }
      return fallback;
    }

    async function verifyDomainLicense(domain, inputCode) {
      try {
        const cleanCode = String(inputCode || "").trim().toUpperCase();
        if (!cleanCode.startsWith("LV-")) return false;

        const enc = new TextEncoder();
        const keyData = enc.encode(MASTER_LICENSE_SECRET);
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const dataToSign = enc.encode(`${domain.toLowerCase()}:SACRED_ETERNAL_LICENSE`);
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const fullHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

        const p1 = fullHex.substring(0, 4);
        const p2 = fullHex.substring(4, 8);
        const p3 = fullHex.substring(8, 12);
        const p4 = fullHex.substring(12, 16);
        const expectedCode = `LV-${p1}-${p2}-${p3}-${p4}`;

        return cleanCode === expectedCode;
      } catch (_) {
        return false;
      }
    }

    try {
      // 1. 获取全站配置 (GET /api/love/config)
      if (url.pathname === "/api/love/config" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        const isAdmin = await verifyAdminAuth(request);
        const headerAuth = request.headers.get("x-admin-auth");
        const queryAuth = url.searchParams.get("auth");
        const attemptedAuth = (headerAuth || queryAuth || "").trim();

        if (attemptedAuth && !isAdmin) {
          return jsonResponse({ success: false, error: "管理口令错误或未授权", isAdmin: false }, 401);
        }

        let customConfig = null;
        try {
          const obj = await bucket.get(CONFIG_KEY);
          if (obj) customConfig = JSON.parse(await obj.text());
        } catch (_) {}

        if (customConfig) {
          if (!isAdmin) {
            if (customConfig.gatekeeper) delete customConfig.gatekeeper.correctAnswer;
            if (customConfig.adminSecurity) delete customConfig.adminSecurity.password;
          }
          return jsonResponse({
            success: true,
            custom: true,
            domain: rawHost,
            config: customConfig,
            isAdmin
          });
        }

        return jsonResponse({ success: true, custom: false, domain: rawHost, config: null, isAdmin });
      }

      // 2. 保存并发布配置 (POST /api/love/config)
      if (url.pathname === "/api/love/config" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "管理口令错误或未授权" }, 401);

        let reqData;
        try { reqData = await request.json(); } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        const configToSave = reqData.config || {};
        const configJsonString = JSON.stringify(configToSave);

        if (!sanitizeSanctity(configJsonString)) {
          return jsonResponse({
            success: false,
            error: "包含不洁与低俗言语，圣洁的印记已拒绝此次铭刻。请保持言语的尊重与圣洁。"
          }, 406);
        }

        try {
          const existingObj = await bucket.get(CONFIG_KEY);
          if (existingObj) {
            const oldCfg = JSON.parse(await existingObj.text());
            if (oldCfg._license && oldCfg._license.unlocked) {
              configToSave._license = oldCfg._license;
            }
            if (oldCfg.petData && !configToSave.petData) {
              configToSave.petData = oldCfg.petData;
            }
          }
        } catch (_) {}

        await bucket.put(CONFIG_KEY, JSON.stringify(configToSave), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({
          success: true,
          domain: rawHost,
          message: `配置已发布并永久同步至【${rawHost}】独立存储空间`
        });
      }

      // 🌟 3. 智能提醒邮件即时测试接口 (POST /api/love/reminder/test)
      if (url.pathname === "/api/love/reminder/test" && request.method === "POST") {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);

        let body = {};
        try { body = await request.json(); } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        const reminderCfg = body.reminderConfig || {};
        const apiKey = reminderCfg.resendApiKey;
        const boyEmail = reminderCfg.boyEmail?.trim();
        const girlEmail = reminderCfg.girlEmail?.trim();
        const recipients = [boyEmail, girlEmail].filter(Boolean);

        if (!apiKey) return jsonResponse({ success: false, error: "请先配置 Resend API Key" }, 400);
        if (recipients.length === 0) return jsonResponse({ success: false, error: "请至少填写一个通知邮箱" }, 400);

        const emailHtml = buildRomanticEmailHtml({
          siteTitle: "众水不灭 · 雅歌之印",
          boyName: "张小阳",
          girlName: "李小光",
          eventTitle: "✨ 智能提醒通知通道测试成功",
          daysText: "测试连通",
          dateMeta: `测试时刻: ${new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19)} (北京时间)`,
          memo: "这条测试消息证明您的 Resend 邮件引擎已完美连接！在每一个重要的纪念日与生日前夕，爱的心意都将准时送达。",
          hostUrl: `https://${rawHost}`
        });

        const sendResult = await sendResendEmail({
          apiKey,
          fromEmail: reminderCfg.senderEmail,
          toEmails: recipients,
          subject: "💌【雅歌之印】智能提醒邮件通道测试成功",
          htmlContent: emailHtml
        });

        if (sendResult.success) {
          return jsonResponse({ success: true, message: "🎉 测试邮件发送成功，请前往收件箱查收！" });
        }
        return jsonResponse({ success: false, error: sendResult.error || "发信失败" }, 500);
      }

      // 4. 破冰信号状态机系统 (GET /api/love/signal)
      if (url.pathname === "/api/love/signal" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        let signalData = { activeSignal: null, history: [] };
        try {
          const obj = await bucket.get(SIGNALS_KEY);
          if (obj) signalData = JSON.parse(await obj.text());
        } catch (_) {}

        const now = Date.now();
        if (signalData.activeSignal) {
          const isExpired = (now - signalData.activeSignal.createdAt) > 24 * 60 * 60 * 1000;
          if (isExpired && signalData.activeSignal.status === "active") {
            signalData.activeSignal.status = "expired";
          }
        }

        return jsonResponse({
          success: true,
          activeSignal: signalData.activeSignal || null,
          recentHistory: (signalData.history || []).slice(0, 10),
          serverTime: now
        });
      }

      // 5. 发射破冰信号 (POST /api/love/signal)
      if (url.pathname === "/api/love/signal" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        let body = {};
        try { body = await request.json(); } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        const stage = String(body.stage || "dating");
        const senderGender = String(body.senderGender || "boy");
        const senderDeviceId = String(body.senderDeviceId || "").trim();
        const actionType = String(body.actionType || "break_ice");
        const customText = String(body.customText || "").trim();

        if (!sanitizeSanctity(customText)) {
          return jsonResponse({ success: false, error: "言语不洁，请保持尊重与圣洁。" }, 406);
        }

        const safeContent = getStageSafeContent(stage, actionType, customText);
        const now = Date.now();

        let signalData = { activeSignal: null, history: [] };
        try {
          const obj = await bucket.get(SIGNALS_KEY);
          if (obj) signalData = JSON.parse(await obj.text());
        } catch (_) {}

        const currentSig = signalData.activeSignal;
        if (currentSig && currentSig.status === "active") {
          if (currentSig.senderDeviceId === senderDeviceId && currentSig.cooldownUntil && currentSig.cooldownUntil > now) {
            return jsonResponse({
              success: false,
              code: "IN_COOLDOWN",
              remainingSeconds: Math.ceil((currentSig.cooldownUntil - now) / 1000),
              message: "还在情绪冷静期，请深呼吸稍作等待..."
            }, 429);
          }

          const isFromOtherSide = currentSig.senderGender !== senderGender;
          const isCurrentPeaceAction = ["break_ice", "apology", "miss_you", "warm_hug"].includes(actionType);
          const isPrevPeaceAction = ["break_ice", "apology", "miss_you", "warm_hug"].includes(currentSig.actionType);
          const isWithinWindow = (now - currentSig.createdAt) < 5 * 60 * 1000;

          if (isFromOtherSide && isCurrentPeaceAction && isPrevPeaceAction && isWithinWindow) {
            currentSig.status = "mutual_resolved";
            currentSig.resolvedAt = now;
            currentSig.summary = "你们在同一刻想到了彼此，双向奔赴，爱永不止息！";

            if (!Array.isArray(signalData.history)) signalData.history = [];
            signalData.history.unshift({
              id: `hist_${now}`,
              stage,
              initiator: "both",
              actionType: "mutual_resolved",
              summary: "双向奔赴 · 在同一刻选择了和好",
              resolvedAt: now
            });
            if (signalData.history.length > 30) signalData.history = signalData.history.slice(0, 30);

            await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), {
              httpMetadata: { contentType: "application/json; charset=utf-8" }
            });

            return jsonResponse({
              success: true,
              status: "mutual_resolved",
              message: "✨ 你们在同一刻想到了彼此，破冰成功！",
              signal: currentSig
            });
          }
        }

        const cooldownMs = actionType === "calm_down" ? (15 * 60 * 1000) : (60 * 1000);
        const newActiveSignal = {
          signalId: `sig_${now}_${Math.random().toString(36).substring(2, 6)}`,
          stage,
          senderGender,
          senderDeviceId,
          actionType,
          content: safeContent,
          status: "active",
          createdAt: now,
          cooldownUntil: now + cooldownMs,
          response: null
        };

        signalData.activeSignal = newActiveSignal;

        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({
          success: true,
          message: "🕊️ 情感信号已传递至云端！",
          signal: newActiveSignal
        });
      }

      // 6. 响应破冰信号 (POST /api/love/signal/ack)
      if (url.pathname === "/api/love/signal/ack" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        let body = {};
        try { body = await request.json(); } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        const signalId = String(body.signalId || "").trim();
        const responderGender = String(body.responderGender || "girl");
        const responderDeviceId = String(body.responderDeviceId || "").trim();
        const responseType = String(body.responseType || "accept");
        const responseText = String(body.responseText || "").trim();

        if (!sanitizeSanctity(responseText)) {
          return jsonResponse({ success: false, error: "言语不洁" }, 406);
        }

        let signalData = { activeSignal: null, history: [] };
        try {
          const obj = await bucket.get(SIGNALS_KEY);
          if (obj) signalData = JSON.parse(await obj.text());
        } catch (_) {}

        const currentSig = signalData.activeSignal;
        if (!currentSig || currentSig.signalId !== signalId) {
          return jsonResponse({ success: false, error: "信号已过期或已被处理" }, 404);
        }

        const now = Date.now();

        if (responseType === "viewed") {
          if (currentSig.status === "active") {
            currentSig.status = "viewed";
            currentSig.viewedAt = now;
          }
        } else if (responseType === "accept") {
          currentSig.status = "accepted";
          currentSig.resolvedAt = now;
          currentSig.response = {
            responderGender,
            responderDeviceId,
            type: "accept",
            text: responseText || "愿爱包容一切，我们和好吧！",
            respondedAt: now
          };

          if (!Array.isArray(signalData.history)) signalData.history = [];
          signalData.history.unshift({
            id: `hist_${now}`,
            stage: currentSig.stage,
            initiator: currentSig.senderGender,
            actionType: currentSig.actionType,
            summary: `${currentSig.content} ➔ ${currentSig.response.text}`,
            status: "accepted",
            resolvedAt: now
          });
          if (signalData.history.length > 30) signalData.history = signalData.history.slice(0, 30);
        } else if (responseType === "wait_a_bit") {
          currentSig.status = "cooling";
          currentSig.response = {
            responderGender,
            responderDeviceId,
            type: "wait_a_bit",
            text: responseText || "还在整理心情中，请再等我一会儿...",
            respondedAt: now
          };
        }

        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({ success: true, message: "✓ 响应已同步！", signal: currentSig });
      }

      // 7. 查看历史和好足迹备忘录 (GET /api/love/signal/history)
      if (url.pathname === "/api/love/signal/history" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        let signalData = { history: [] };
        try {
          const obj = await bucket.get(SIGNALS_KEY);
          if (obj) signalData = JSON.parse(await obj.text());
        } catch (_) {}

        return jsonResponse({ success: true, history: signalData.history || [] });
      }

      // 8. 重置信号队列 (POST /api/love/signal/clear)
      if (url.pathname === "/api/love/signal/clear" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        let signalData = { activeSignal: null, history: [] };
        try {
          const obj = await bucket.get(SIGNALS_KEY);
          if (obj) signalData = JSON.parse(await obj.text());
        } catch (_) {}

        signalData.activeSignal = null;
        signalData.reminderLog = {};

        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({ success: true, message: "已重置信号状态与提醒日志" });
      }

      // 9. 上传多媒体附件 (POST /api/love/upload)
      if (url.pathname === "/api/love/upload" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "未授权或管理口令错误" }, 401);

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return jsonResponse({ success: false, error: "未接收到文件" }, 400);

        const safeName = (file.name || "media.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const r2Key = `${tenantDir}/assets/${Date.now()}_${safeName}`;

        await bucket.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type || "application/octet-stream" }
        });

        return jsonResponse({ success: true, url: `/raw/${r2Key}` });
      }

      // 10. 恩典灵宠通道
      if (url.pathname === "/api/love/pet") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        if (request.method === "GET") {
          try {
            const obj = await bucket.get(CONFIG_KEY);
            if (obj) {
              const cfg = JSON.parse(await obj.text());
              return jsonResponse({ success: true, petData: cfg.petData || null });
            }
          } catch (_) {}
          return jsonResponse({ success: true, petData: null });
        }

        if (request.method === "POST") {
          let reqData = {};
          try { reqData = await request.json(); } catch (_) {}
          const newPetData = reqData.petData;
          if (!newPetData) return jsonResponse({ success: false, error: "无数据" }, 400);

          if (!sanitizeSanctity(JSON.stringify(newPetData))) {
            return jsonResponse({ success: false, error: "言语不洁" }, 406);
          }

          let cfg = {};
          try {
            const obj = await bucket.get(CONFIG_KEY);
            if (obj) cfg = JSON.parse(await obj.text());
          } catch (_) {}

          cfg.petData = newPetData;
          await bucket.put(CONFIG_KEY, JSON.stringify(cfg), {
            httpMetadata: { contentType: "application/json; charset=utf-8" }
          });

          return jsonResponse({ success: true, message: "灵宠足迹已同步至云端" });
        }
      }

      // 11. 门禁校验
      if (url.pathname === "/api/love/verify-gatekeeper" && request.method === "POST") {
        let reqData = {};
        try { reqData = await request.json(); } catch (_) {}
        const inputPwd = String(reqData.password || "").trim().toLowerCase();

        let correctPwd = "240520";
        let customAdminPwd = null;

        if (bucket) {
          try {
            const cfgObj = await bucket.get(CONFIG_KEY);
            if (cfgObj) {
              const cfg = JSON.parse(await cfgObj.text());
              if (cfg.gatekeeper?.correctAnswer) {
                correctPwd = String(cfg.gatekeeper.correctAnswer).trim().toLowerCase();
              }
              if (cfg.adminSecurity?.password) {
                customAdminPwd = String(cfg.adminSecurity.password).trim().toLowerCase();
              }
            }
          } catch (_) {}
        }

        let isAdmin = false;
        if (customAdminPwd) {
          if (inputPwd === customAdminPwd || (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== "521" && inputPwd === String(env.ADMIN_PASSWORD).trim().toLowerCase())) {
            isAdmin = true;
          }
        } else {
          if (inputPwd === "521" || inputPwd === "admin" || inputPwd === ADMIN_PASSWORD.toLowerCase()) {
            isAdmin = true;
          }
        }

        if (isAdmin) return jsonResponse({ success: true, isAdmin: true });
        if (inputPwd === correctPwd) return jsonResponse({ success: true, isAdmin: false });
        return jsonResponse({ success: false, message: "口令错误" }, 403);
      }

      // 12. 域名专属授权兑换
      if (url.pathname === "/api/love/verify-license" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "存储服务不可用" }, 500);

        let reqData = {};
        try { reqData = await request.json(); } catch (_) {}
        const code = reqData.licenseCode;
        const incomingConfig = reqData.currentConfig;

        const isValid = await verifyDomainLicense(rawHost, code);
        if (!isValid) return jsonResponse({ success: false, message: "⚠️ 授权激活码无效或与当前域名不匹配！" }, 403);

        let currentCfg = {};
        try {
          const cfgObj = await bucket.get(CONFIG_KEY);
          if (cfgObj) currentCfg = JSON.parse(await cfgObj.text());
          else if (incomingConfig && typeof incomingConfig === "object") currentCfg = incomingConfig;
        } catch (_) {
          if (incomingConfig && typeof incomingConfig === "object") currentCfg = incomingConfig;
        }

        currentCfg._license = {
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          tier: "SACRED_ETERNAL_PERPETUAL",
          boundDomain: rawHost
        };

        await bucket.put(CONFIG_KEY, JSON.stringify(currentCfg), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({ success: true, message: `✨ 星河契约已鉴证！【${rawHost}】专属高级隐藏福泽已永久解锁。` });
      }

      // 13. 清理废弃文件
      if (url.pathname === "/api/love/cleanup" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);

        let activeKeys = new Set();
        try {
          const cfgObj = await bucket.get(CONFIG_KEY);
          if (cfgObj) {
            const rawText = await cfgObj.text();
            const matches = rawText.match(/\/raw\/([a-zA-Z0-9_\-\.\/]+)/g) || [];
            matches.forEach(m => activeKeys.add(decodeURIComponent(m.replace(/^\/raw\//, ""))));
          }
        } catch (_) {}

        let deletedCount = 0;
        let freedBytes = 0;
        const prefix = `${tenantDir}/assets/`;
        const listed = await bucket.list({ prefix });

        for (const obj of listed.objects) {
          const isReferenced = activeKeys.has(obj.key);
          const isOlderThan10Min = (Date.now() - new Date(obj.uploaded).getTime()) > 10 * 60 * 1000;

          if (!isReferenced && isOlderThan10Min) {
            freedBytes += obj.size;
            deletedCount++;
            await bucket.delete(obj.key);
          }
        }

        return jsonResponse({
          success: true,
          deletedCount,
          freedBytes,
          message: `已清理当前站点 ${deletedCount} 个废弃文件，释放空间 ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
        });
      }

      // 14. 在线音乐检索 (酷狗官方接口)
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = (url.searchParams.get("keyword") || "").trim();
        const songs = [];
        const seen = new Set();

        if (keyword) {
          try {
            const kgRes = await fetch(
              `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=10&filter=2&bitrate=0&isfp=0`,
              { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
            );
            if (kgRes.ok) {
              const kgData = await kgRes.json();
              const kgList = kgData.data?.lists || [];
              kgList.forEach(item => {
                const sName = (item.SongName || "").replace(/<[^>]+>/g, "");
                const sArtist = (item.SingerName || "").replace(/<[^>]+>/g, "");
                const fHash = item.FileHash || item.HQFileHash || item.SQFileHash;
                if (sName && fHash && !seen.has(fHash)) {
                  seen.add(fHash);
                  songs.push({
                    id: fHash,
                    title: sName,
                    artist: sArtist,
                    albumId: item.AlbumID || "0",
                    url: `/api/love/music-stream?hash=${fHash}&album_id=${item.AlbumID || 0}&title=${encodeURIComponent(sName)}&artist=${encodeURIComponent(sArtist)}`
                  });
                }
              });
            }
          } catch (_) {}
        }

        return jsonResponse({ success: true, songs });
      }

      // 15. 音频流式代理
      if (url.pathname === "/api/love/music-stream" && request.method === "GET") {
        const hash = url.searchParams.get("hash");
        const albumId = url.searchParams.get("album_id") || "0";
        const title = url.searchParams.get("title") || "";
        const artist = url.searchParams.get("artist") || "";
        let targetAudioUrl = "";

        if (hash) {
          try {
            const kgInfoRes = await fetch(`https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`, {
              headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" }
            });
            if (kgInfoRes.ok) {
              const info = await kgInfoRes.json();
              if (info && info.url && info.url.startsWith("http")) {
                targetAudioUrl = info.url;
              }
            }
          } catch (_) {}

          if (!targetAudioUrl) {
            try {
              const kgWebRes = await fetch(`https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=${hash}&album_id=${albumId}&dfid=-&mid=-&platid=4&_=${Date.now()}`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                  "Cookie": "kg_mid=e8d0e74b68ef5c4c95f19067b5b5c935; kg_dfid=2xP9uN2gRj5h0Xg5m54P2x9n",
                  "Referer": "https://www.kugou.com/"
                }
              });
              if (kgWebRes.ok) {
                const data = await kgWebRes.json();
                targetAudioUrl = data.data?.play_url || data.data?.play_backup_url || "";
              }
            } catch (_) {}
          }
        }

        if (!targetAudioUrl && (title || hash)) {
          try {
            const querySong = `${title} ${artist}`.trim();
            if (querySong) {
              const kwUrl = `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(querySong)}&pn=0&rn=1&vipver=1&ft=music&encoding=utf8&rformat=json&mobi=1`;
              const kwRes = await fetch(kwUrl, { headers: { "User-Agent": "okhttp/3.10.0" } });
              if (kwRes.ok) {
                const kwText = await kwRes.text();
                const ridMatch = kwText.match(/\"MUSICRID\":\"MUSIC_(\d+)\"/i) || kwText.match(/\"rid\":(\d+)/i) || kwText.match(/\"DC_TARGETID\":\"(\d+)\"/i);
                if (ridMatch && ridMatch[1]) {
                  const kwPlayRes = await fetch(`https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${ridMatch[1]}&format=mp3&response=url`, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                  });
                  if (kwPlayRes.ok) {
                    const directUrl = (await kwPlayRes.text()).trim();
                    if (directUrl && directUrl.startsWith("http")) targetAudioUrl = directUrl;
                  }
                }
              }
            }
          } catch (_) {}
        }

        if (!targetAudioUrl || !targetAudioUrl.startsWith("http")) {
          return new Response("Audio Source Unavailable Due To Copyright", { status: 404, headers: corsHeaders });
        }

        try {
          const range = request.headers.get("Range");
          const forwardHeaders = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Referer": "" };
          if (range) forwardHeaders["Range"] = range;

          const streamRes = await fetch(targetAudioUrl, { headers: forwardHeaders, redirect: "follow" });
          if (streamRes.ok || streamRes.status === 206) {
            const responseHeaders = new Headers(corsHeaders);
            responseHeaders.set("Content-Type", streamRes.headers.get("Content-Type") || "audio/mpeg");
            responseHeaders.set("Accept-Ranges", "bytes");
            if (streamRes.headers.get("Content-Length")) responseHeaders.set("Content-Length", streamRes.headers.get("Content-Length"));
            if (streamRes.headers.get("Content-Range")) responseHeaders.set("Content-Range", streamRes.headers.get("Content-Range"));
            return new Response(streamRes.body, { status: streamRes.status, headers: responseHeaders });
          }
        } catch (_) {}

        return Response.redirect(targetAudioUrl, 302);
      }

      // 16. 静态文件流式输出 (/raw/*)
      if (url.pathname.startsWith("/raw/")) {
        if (!bucket) return new Response("Bucket Not Found", { status: 500 });
        const key = decodeURIComponent(url.pathname.replace(/^\/raw\//, ""));

        const rangeHeader = request.headers.get("Range");
        let r2Options = {};
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : undefined;
            r2Options.range = { offset: start, length: end ? end - start + 1 : undefined };
          }
        }

        const object = await bucket.get(key, r2Options);
        if (!object) return new Response("File Not Found", { status: 404 });

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("ETag", object.httpEtag);
        headers.set("Accept-Ranges", "bytes");
        headers.set("Cache-Control", "public, max-age=604800, immutable");

        if (r2Options.range && object.range) {
          headers.set("Content-Range", `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
          return new Response(object.body, { status: 206, headers });
        }
        return new Response(object.body, { headers });
      }

    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }

    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
