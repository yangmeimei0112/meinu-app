# 🔍 Google 搜尋引擎收錄與 SEO 登錄完整教學指南

這份指南將手把手教您如何將「咩nu 揪團點餐平台」登錄到 Google 搜尋引擎中，讓任何人在 Google 輸入關鍵字（例如：「咩nu」、「咩nu 點餐」、「辦公室揪團點餐」）時，都能快速搜尋並點擊進入您的網站！

---

## 🛠️ 專案已為您完成的 SEO 自動化優化 (內建完成)

專案代碼已經幫您做好了所有最頂級的 SEO 與搜尋引擎優化：

1. **動態 Sitemap 網站地圖 (`/sitemap.xml`)**：
   - 自動將首頁、搜尋頁、購物車以及**所有在 Supabase 上架的店家菜單頁面**生成標準 XML 地圖，供 Googlebot 爬蟲每日自動抓取。
2. **搜尋引擎漫遊器規範 (`/robots.txt`)**：
   - 指引 Google 爬蟲優先抓取前台菜單與活動頁面，並自動阻斷私密後台端點 (`/admin` 與 `/api/`)。
3. **Google 結構化資料 (Schema.org JSON-LD)**：
   - 注入 `WebSite` 與 `WebApplication` 結構化資料，讓 Google 搜尋結果能呈現精美的應用程式摘要卡片與搜尋框。
4. **社群分享 Open Graph & Twitter Card**：
   - 在 LINE、Facebook、Twitter 分享網站連結時，會自動呈現精美的封面圖片與標題介紹。
5. **行動端友善與 Core Web Vitals 優化**：
   - 支援 100dvh 動態視口、iOS Safe Area 全螢幕適配與極速載入。

---

## 🚀 讓 Google 搜尋能查到網站的 4 大實戰步驟

要讓 Google 正式收錄您的網站，您只需依照以下 4 個步驟在 **Google Search Console** 提交網站：

### 步驟 1：確認您的網站已成功上線（擁有公開網址）
- 例如：`https://meinu2.vercel.app` 或您的自訂網域。
- 在瀏覽器中打開您的網址，確認可以正常瀏覽。

---

### 步驟 2：前往 Google Search Console 註冊資源
1. 打開瀏覽器，前往 [Google Search Console 官方網站](https://search.google.com/search-console)。
2. 使用您的 Google 帳號登入。
3. 點擊左上角的 **「新增資源」**。
4. 選擇右側的 **「網址前置字元」**（URL prefix），並輸入您的完整網站網址（例如：`https://meinu2.vercel.app`），然後點擊「繼續」。

---

### 步驟 3：驗證網站擁有權（最簡單的 HTML 標記法）
1. 在驗證方式中，選擇 **「HTML 標記」**（HTML Tag）。
2. Google 會給您一段類似 `<meta name="google-site-verification" content="xxxxxxxxxxxx" />` 的代碼。
3. 複製 `content="xxxxxxxxxxxx"` 中的這一串驗證碼。
4. 有兩種簡單方式套用：
   - **方式 A (推薦)**：在您的 Vercel / 部署環境的環境變數中，新增 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`，值填入剛才的驗證碼。
   - **方式 B**：直接將驗證碼告訴我，我會幫您填入 `src/app/layout.tsx` 中。
5. 回到 Google Search Console 頁面，點擊 **「驗證」** 按鈕，即可看到綠色勾勾「擁有權已驗證成功」！

---

### 步驟 4：提交 Sitemap 網站地圖，加速 Google 立即抓取
1. 在 Google Search Console 左側選單中，點擊 **「Sitemap」**（網站地圖）。
2. 在「新增 Sitemap」輸入框中輸入：
   ```text
   sitemap.xml
   ```
3. 點擊 **「提交」**。
4. 狀態會顯示為 **「成功」**，Google 爬蟲將會立即排程抓取您的全站頁面！

---

## ⚡ 密技：讓 Google 「當天/立即」收錄您的首頁

一般情況下 Google 爬蟲會在 1~3 天內建立索引。若您希望**立刻**被收錄：

1. 在 Google Search Console 最上方的搜尋框中，輸入您的網站首頁網址（例如：`https://meinu2.vercel.app`）並按 Enter。
2. 系統會顯示「網址未列在 Google 上」。
3. 點擊右側的 **「要求建立索引」**（Request Indexing）按鈕。
4. Google 就會將您的網站排入最高優先權佇列，通常在數小時至 1 天內即可在 Google 搜尋到！

---

## 🔍 如何測試 Google 是否已收錄您的網站？

在 Google 搜尋框中輸入：
```text
site:您的網站網址
```
例如：
```text
site:meinu2.vercel.app
```
如果搜尋結果出現了您的網站頁面，就代表 Google 已經正式收錄完成！接下來任何人搜尋「咩nu」或相關文字，都能直接找到您的點餐平台！
