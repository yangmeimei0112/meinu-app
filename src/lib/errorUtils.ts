/**
 * 🇹🇼 統一繁體中文（台灣習慣用語）錯誤訊息轉譯工具
 * 將所有底層資料庫、Supabase Auth、WebAuthn、瀏覽器 Fetch、Gemini API 之英文錯誤
 * 轉譯為親切、清晰且符合台灣在地化語意的繁體中文提示。
 */

export function formatErrorMessage(err: any, fallback: string = '操作未成功，請稍後再試'): string {
  if (!err) return fallback;

  // 若傳入已是字串
  const rawMsg = typeof err === 'string' ? err : err.message || err.error_description || err.error || '';
  if (!rawMsg) return fallback;

  const msg = String(rawMsg).trim();

  // 若已經完全是繁體中文且無英文例外字串，直接返回
  if (
    /[\u4e00-\u9fa5]/.test(msg) &&
    !msg.includes('Error:') &&
    !msg.includes('status code') &&
    !msg.includes('failed with status') &&
    !msg.includes('violates') &&
    !msg.includes('constraint')
  ) {
    return msg;
  }

  const lower = msg.toLowerCase();

  // 1. 會員帳號與認證相關 (Supabase Auth / OAuth)
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return '帳號或密碼錯誤，請重新確認！';
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('email already in use')
  ) {
    return '此電子信箱已被註冊，請直接登入！';
  }
  if (lower.includes('email not confirmed')) {
    return '請先至您的電子信箱收取認證信並點擊連結完成驗證！';
  }
  if (
    lower.includes('password should be at least 6') ||
    lower.includes('password is too short') ||
    lower.includes('password should be')
  ) {
    return '密碼長度至少需要 6 個字元！';
  }
  if (lower.includes('user not found')) {
    return '找不到此會員帳號，請確認輸入資訊或註冊新帳號！';
  }
  if (
    lower.includes('token has expired') ||
    lower.includes('otp_expired') ||
    lower.includes('invalid token') ||
    lower.includes('token expired')
  ) {
    return '驗證連結或代碼已逾期或失效，請重新申請！';
  }
  if (lower.includes('email link is invalid or has expired')) {
    return '密碼重設連結已失效或逾期，請重新發送申請！';
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return '操作請求過於頻繁，請稍候片刻後再試！';
  }
  if (lower.includes('for security purposes, you can only request this after')) {
    return '為維護帳號安全，短時間內請勿重複發送，請稍候再試！';
  }
  if (lower.includes('signup requires a valid password')) {
    return '註冊時請輸入有效的密碼！';
  }
  if (
    lower.includes('unsupported provider') ||
    lower.includes('provider is not enabled') ||
    lower.includes('validation_failed')
  ) {
    return '系統尚未啟用此登入方式，請聯繫系統管理員！';
  }
  if (
    lower.includes('auth session missing') ||
    lower.includes('jwt expired') ||
    lower.includes('invalid claim')
  ) {
    return '您的登入憑證已過期，請重新登入！';
  }

  // 2. 生物辨識與 Passkey (WebAuthn)
  if (
    lower.includes('aborterror') ||
    lower.includes('user cancelled') ||
    lower.includes('user canceled') ||
    lower.includes('the operation was aborted')
  ) {
    return '已取消生物辨識驗證';
  }
  if (
    lower.includes('notallowederror') ||
    lower.includes('the operation is either not allowed')
  ) {
    return '裝置未授權生物辨識或驗證已被取消';
  }
  if (
    lower.includes('no passkeys found') ||
    lower.includes('credential not found')
  ) {
    return '找不到此裝置上的 Passkey 金鑰，請先使用密碼登入後進行綁定！';
  }
  if (
    lower.includes('forbidden') ||
    lower.includes('403') ||
    lower.includes('rp id')
  ) {
    return 'Passkey 伺服器網域設定不符，請聯繫系統管理員！';
  }
  if (lower.includes('securityerror')) {
    return '當前連線環境不符合生物辨識安全標準（需在 HTTPS 安全連線下進行）';
  }
  if (lower.includes('notsupportederror')) {
    return '當前瀏覽器或作業系統不支援 Passkey 生物辨識功能';
  }

  // 3. 網路與伺服器連線 (Network / HTTP)
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('fetch failed') ||
    lower.includes('load failed')
  ) {
    return '網路連線不穩定或中斷，請檢查網路連線後重試！';
  }
  if (
    lower.includes('timeout') ||
    lower.includes('etimedout') ||
    lower.includes('timed out')
  ) {
    return '伺服器回應逾時，請稍後再試！';
  }
  if (lower.includes('500') || lower.includes('internal server error')) {
    return '伺服器處理異常，請稍後重試！';
  }
  if (
    lower.includes('502') ||
    lower.includes('bad gateway') ||
    lower.includes('503') ||
    lower.includes('service unavailable') ||
    lower.includes('504')
  ) {
    return '系統服務維護升級中，請稍候片刻！';
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return '權限不足或尚未登入，請先登入後再進行操作！';
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return '找不到指定的資料或頁面不存在！';
  }

  // 4. 資料庫限制與約束 (PostgreSQL / Supabase Database)
  if (
    lower.includes('duplicate key') ||
    lower.includes('unique constraint') ||
    lower.includes('23505')
  ) {
    return '該資料代號或名稱已存在，請勿重複建立！';
  }
  if (
    lower.includes('foreign key') ||
    lower.includes('violates foreign key constraint') ||
    lower.includes('23503')
  ) {
    return '此項目尚有其他關聯資料正在使用中，無法直接刪除！';
  }
  if (
    lower.includes('not-null constraint') ||
    lower.includes('violates not-null') ||
    lower.includes('23502')
  ) {
    return '必填欄位尚未填寫完整，請確認輸入內容！';
  }
  if (lower.includes('check constraint') || lower.includes('23514')) {
    return '輸入的數值或格式不符合系統規定，請重新檢查！';
  }
  if (lower.includes('row-level security') || lower.includes('rls')) {
    return '無存取此資料的權限，請確認管理權限！';
  }

  // 5. Google Gemini AI 視覺掃描相關
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key')
  ) {
    return 'Google Gemini API Key 無效，請確認金鑰是否完整複製！';
  }
  if (
    lower.includes('resource has been exhausted') ||
    lower.includes('quota') ||
    lower.includes('429')
  ) {
    return 'AI 辨識額度已達上限或請求過於頻繁，請稍候片刻再試！';
  }
  if (lower.includes('user location is not supported')) {
    return '當前地區暫不支援此 AI 服務呼叫！';
  }

  return fallback;
}
