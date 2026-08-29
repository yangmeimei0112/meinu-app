# 🛡️ 咩nu 團購點餐平台 — 資安防護架構與部署安全指引 (Security Guide)

本文件詳細說明本專案之全方位資安防護架構、環境變數配置規範與威脅防禦矩陣。

---

## 🔑 必要環境變數配置 (Environment Variables)

在本地開發 (`.env.local`) 或生產環境 (如 Vercel Dashboard / Railway 等) 部署時，必須配置以下環境變數：

| 變數名稱 | 作用層級 | 安全要求 | 說明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_PASSCODE` | **伺服端專用** | 至少 8 ~ 16 字元高強度密碼 | 團長後台登入解鎖密碼。<br>⚠️ **切勿加上 `NEXT_PUBLIC_` 前綴**，否則會被編譯入前端公開 Bundle。 |
| `AUTH_SECRET_KEY` | **伺服端專用** | 64 字元隨機十六進位字串 | 用於 HMAC-SHA256 簽署與驗證後台 Admin Token。<br>若未設定，伺服端將在啟動時拋出 FATAL 錯誤拒絕啟動，杜絕預設密鑰偽造漏洞。 |
| `NEXT_PUBLIC_SUPABASE_URL` | 公開 | 有效的 HTTPS Supabase 專案網址 | 連接 Supabase 後端資料庫。 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開 | Supabase Publishable / Anon Key | 客戶端公開金鑰（搭配 RLS 安全政策使用）。 |

### 快速產生安全密鑰指令
```bash
node -e "const c=require('crypto'); console.log('AUTH_SECRET_KEY='+c.randomBytes(32).toString('hex')); console.log('ADMIN_PASSCODE='+c.randomBytes(8).toString('hex').toUpperCase())"
```

---

## 🏰 七大核心資安防護機制 (Defense in Depth)

### 1. Edge Middleware 邊界阻斷 (`src/middleware.ts`)
- 在 Next.js Edge Runtime 攔截所有 `/admin` 路由。
- 訪客若未攜帶合法 `meinu_admin_token` Cookie，在邊緣節點立即執行 HTTP 307 重定向至首頁，禁止加載後台組件與代碼。
- 徹底防止透過瀏覽器 DevTools 操控 React state 繞過 UI 鎖定。

### 2. 密碼學時序安全與 Token 防偽 (`src/lib/auth-util.ts` & `src/app/api/admin/auth/route.ts`)
- **時序安全比對 (Constant-Time Comparison)**：使用 `crypto.timingSafeEqual` 比對密碼與 HMAC 簽章，杜絕微秒級時序側信道分析攻擊 (Timing Side-Channel Attacks)。
- **Token 嚴格時間窗口**：限制 7 天有效期，並拒絕大於目前時間 60 秒以上的未來時間戳，防止竄改時鐘逃逸。
- **無後備密鑰機制**：強制要求環境變數存在，移除任何公開預設值。

### 3. 多層級防爆破與全域異常熔斷 (Rate Limiter & Brute-Force Defense)
- **單一 IP 階梯式封鎖**：5 次失敗鎖定 60s，7 次失敗鎖定 300s，10 次失敗鎖定 900s。
- **全域分散式撞庫熔斷**：60 秒內全站累計失敗達 20 次，觸發全站 30 秒冷卻保護，防禦 Botnet / Proxy 分散式輪換 IP 撞庫。
- **動態算術人機挑戰 (Math CAPTCHA)**：錯誤次數達 2 次即啟動動態驗證碼，阻斷自動化腳本。

### 4. 嚴格 XSS 輸入過濾與 Unicode 防禦 (`src/lib/security.ts`)
- **直接字符剝除策略**：拒絕並移除所有 `< >` 及 Unicode 全形等效字符（`＜ ＞ \uFE64 \uFE65 \uFF1C \uFF1E`）。
- **偽協議與事件清理**：清除 `javascript:`, `vbscript:`, `data:` 偽協議及 `onload=`, `onerror=` 等內嵌事件屬性。
- **Null Byte 截斷防護**：清除 `\x00` 控制字元。

### 5. 跨站請求偽造防護 (CSRF Protection)
- **Origin / Referer 同源校驗**：管理員驗證、商家編號與維護開關等 API 均執行 Header 來源驗證，阻斷跨來源惡意發送請求。
- **SameSite=Strict Cookie**：認證 Token Cookie 設定 `httpOnly: true`, `sameSite: 'strict'`, `secure: true`。

### 6. 送單速率與防刷單雙層限制 (`src/app/checkout/hooks/useCheckoutOrder.ts`)
- **客戶端速率限制**：連續點擊最小間隔 3.5s，5 分鐘內最多送單 8 次。
- **伺服端防刷防護**：送單時即時查詢同暱稱 5 分鐘內送單筆數，超過 5 筆自動攔截，防止藉由清除 `localStorage` 繞過限制。
- **蜜罐欄位 (Honeypot Trap)**：隱藏欄位遭填寫時立即阻斷，精準攔截全自動爬蟲。
- **人類操作時長檢驗 (Time-to-Interact)**：載入頁面後 1.2 秒內送單判定為腳本機器人。

### 7. 嚴格 HTTP 安全標頭與 MIME 驗證 (`next.config.ts` & `src/app/admin/hooks/useAdminStoreCrud.ts`)
- **Content-Security-Policy (CSP)**：限制腳本、字型、圖片、連線來源白名單。
- **HSTS / X-Frame-Options / X-Content-Type-Options**：強制 HTTPS、禁止 iframe 點擊劫持、禁止 MIME 類型嗅探。
- **圖片上傳白名單**：限制僅允許 `image/jpeg`, `image/png`, `image/webp`, `image/gif`，防止惡意後門文件偽裝副檔名上傳。
