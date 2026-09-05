export interface ChangelogItem {
  type: 'major' | 'feature' | 'enhancement' | 'security_legal' | 'fix';
  title: string;
  description: string;
  badgeText?: string;
}

export interface ChangelogRelease {
  version: string;
  releaseDate: string;
  tag: 'Major' | 'Minor' | 'Patch';
  summary: string;
  isLatest?: boolean;
  highlights: string[];
  items: ChangelogItem[];
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: 'v10.5.1',
    releaseDate: '2026-09-05',
    tag: 'Patch',
    isLatest: true,
    summary: '修復後台非徹底抹除刪除訂單時誤刪前台歷史紀錄之問題，落實後台結單隱藏與前台顧客端訂單資料永續保留機制。',
    highlights: [
      '🛡️ 後台刪除訂單前台資料永續留存：非徹底抹除時，僅從管理員工作台隱藏，顧客端歷史訂單 100% 完整保留',
      '🎯 狀態精準映射對齊：已完成訂單刪除前台顯示【已完成】；未完成/已取消刪除前台顯示【已取消】',
      '🔒 徹底抹除雙重確認防護：唯有明確選擇「徹底抹除」並確認後，才執行前後台資料庫實體抹除',
      '⚡ 前台歷史快取與 SWR 雙保險：送單與狀態頁即時寫入本機快取與 SWR 非破壞性對齊，確保零遺失',
    ],
    items: [
      {
        type: 'fix',
        title: '後台刪除訂單與前台歷史資料分離架構',
        description:
          '修正後台刪除訂單時直接執行資料庫實體 DELETE 的問題。新架構下，後台刪除操作採用軟性標記（hidden_from_admin），資料庫保留記錄供顧客端查詢，徹底避免前台歷史訂單被清空。',
        badgeText: '關鍵架構修復',
      },
      {
        type: 'enhancement',
        title: '前台訂單狀態頁與歷史紀錄容災同步',
        description:
          '強化 useOrderStatus 與 prefetchOrderHistory 之非破壞性同步機制，即便離線或網路波動亦能藉由本地快照即時呈現正確明細與結算資訊。',
        badgeText: '穩定性提升',
      },
    ],
  },
  {
    version: 'v10.5.0',
    releaseDate: '2026-09-05',
    tag: 'Minor',
    isLatest: false,
    summary: '新增訂單取消與退回修改之即時語音播報、後台取消訂單全方位彈窗即時通知、後台通知偏好自訂開關，以及首頁版本號智慧動態同步校準。',
    highlights: [
      '🗣️ 訂單取消語音智慧提醒：顧客於前台退單或修改時，後台自動以臺灣國語播報',
      '⚠️ 後台取消彈窗即時警示：即時彈出視窗展示取消顧客、單號、所屬店家、金額與品項明細',
      '⚙️ 後台通知偏好獨立開關：支援自由切換新單/取消語音與彈窗通知，並持久化保存偏好',
      '🏷️ 首頁版本號智慧動態校準：全面校準版本號格式化引擎，杜絕舊版號殘留與環境變數 fallback 顯示問題',
    ],
    items: [
      {
        type: 'feature',
        title: '訂單取消與退回購物車即時語音提醒',
        description:
          '當顧客在前台點擊「取消訂單」或「修改訂單回到購物車」時，後台即時語音引擎會自動朗讀取消通知（支援完整明細與簡明摘要模式），確保團長第一時間掌握異動。',
        badgeText: '新功能',
      },
      {
        type: 'feature',
        title: '後台訂單取消全方位彈窗即時警示',
        description:
          '顧客取消訂單時，後台畫面中央會自動跳出醒目警示彈窗，完整列出該顧客暱稱、單號、所屬店家、取消時間、總金額與原訂餐點品項明細。',
        badgeText: '新功能',
      },
      {
        type: 'enhancement',
        title: '語音播報與通知設定面板全面升級',
        description:
          '後台設定視窗新增「新訂單語音自動報單」、「訂單取消語音提醒」與「訂單取消彈窗即時通知」三項獨立控制開關，並支援一鍵即時試聽取消播報效果。',
        badgeText: '控制台升級',
      },
      {
        type: 'fix',
        title: '首頁版本號動態對齊與格式化引擎校準',
        description:
          '重構 formatVersionDisplay 格式化引擎，連結 Changelog 權威版本源，徹底修正首頁底部舊版號殘留與環境變數預設值異常之問題。',
        badgeText: '核心修復',
      },
    ],
  },
  {
    version: 'v10.4.9',
    releaseDate: '2026-09-05',
    tag: 'Patch',
    isLatest: false,
    summary: '全站雙核心法律條款（服務條款與隱私權政策）權威整併、更新日誌 (Changelog) 視覺化中心正式上線、全自動整合測試與 API 對齊達 100% 通過。',
    highlights: [
      '📜 服務條款與隱私權政策雙核心法規整併（包含 9 大契約條款與 8 大資安隱私章節）',
      '✨ 官方「更新日誌 (Changelog)」中心上線，收錄平台全版本演進歷史',
      '🛡️ 28 項深度全自動整合測試與 API Route 架構對齊 100% 通過',
    ],
    items: [
      {
        type: 'security_legal',
        title: '權威法律條款雙核心重構',
        description:
          '將原分散之協議整併為「服務條款 (Terms of Service)」與「隱私權政策 (Privacy Policy - 已整合安全協議)」，完整明訂賠償責任上限封頂（NT$ 1,000）、中華民國準據法與臺北地方法院專屬管轄，並落實個資法五大權利保障與一鍵註銷機制。',
        badgeText: '法規合規',
      },
      {
        type: 'feature',
        title: '全新高質感「更新日誌」中心',
        description:
          '新增視覺化版本演進時間軸（/changelog），提供版本類型篩選、即時關鍵字搜尋、列印與連結分享功能，記錄平台自 v1.0.0 至今的所有重大里程碑。',
        badgeText: '新頁面',
      },
      {
        type: 'fix',
        title: 'API 服務層與資料庫原生欄位對齊',
        description:
          '重構 useAdminStoreCrud 與 useAdminProductCrud，將非原生資料庫欄位 (code, sort_order) 隔離至專屬 API 服務獨立管理，杜絕任何潛在寫入欄位衝突。',
        badgeText: '架構優化',
      },
    ],
  },
  {
    version: 'v10.4.0',
    releaseDate: '2026-09-04',
    tag: 'Minor',
    summary: '前台歷史訂單持久化隔離技術、智慧訂單狀態映射與確認機制、前台一鍵清空歷史紀錄、常用客製化選項庫自訂命名支援。',
    highlights: [
      '🔒 前台歷史訂單本機持久化技術：後台刪除點餐資料不影響前台顧客歷史紀錄',
      '🚦 智慧狀態映射：後台刪除「已完成」訂單前台保留已完成，「等待中/取消」自動映射為已取消',
      '⚡ 常用客製化選項庫支援自訂命名（選填）',
      '🗑️ 前台個人歷史訂單新增「一鍵清空全部歷史」雙重確認機制',
    ],
    items: [
      {
        type: 'feature',
        title: '前台訂單紀錄獨立持久化 (Client Order Isolation)',
        description:
          '將前台個人歷史訂單自後台同步流中解耦隔離，即使團長於管理後台清理活動點餐資料，前台顧客之點餐記憶與核銷金額仍能完整保留於本機儲存庫中。',
        badgeText: '核心功能',
      },
      {
        type: 'enhancement',
        title: '後台刪除狀態確認彈窗與智慧映射',
        description:
          '當後台欲刪除處理中之訂單時，提供即時狀態確認彈窗，允許管理者自主決定前台訂購人端顯示為「已取消」或「已完成」。',
        badgeText: '互動提升',
      },
      {
        type: 'feature',
        title: '常用客製化範本自訂命名',
        description:
          '在單品與多品批量編輯中，將自訂選項存為範本時支援「自訂範本名稱」（如：經典手搖配方、牛排熟度推薦），讓範本庫管理更具條理。',
        badgeText: '效率工具',
      },
    ],
  },
  {
    version: 'v10.3.0',
    releaseDate: '2026-09-03',
    tag: 'Minor',
    summary: '網頁端極速多商品批量上架工作台 (Batch Product Studio) 全新上線、內建互動式引導小精靈 (Wizard Mode) 開關。',
    highlights: [
      '⚡ 網頁端極速多商品批量上架工作台：無需 CSV 即可快速上架數十項商品',
      '🧙‍♂️ 互動式引導小精靈 (Wizard Mode)：提供即時步驟指引與一鍵開關切換',
      '📦 多商品同步批量套用規格、分類與加價選項',
    ],
    items: [
      {
        type: 'major',
        title: '極速多商品批量上架工作台 (Batch Product Studio)',
        description:
          '專為店家快速開店設計的網頁端批量編輯器，支援鍵盤快速跳格、批量分類套用、一鍵複製多列與即時規格同步，上架效率提升 500%。',
        badgeText: '重大功能',
      },
      {
        type: 'feature',
        title: '引導小精靈精準指引系統',
        description:
          '為批量上架與菜單設計提供可隨時開關的步驟引導小精靈，新團長與店家可快速掌握多商品配置流程。',
        badgeText: '使用者體驗',
      },
    ],
  },
  {
    version: 'v10.2.0',
    releaseDate: '2026-09-02',
    tag: 'Patch',
    summary: '全站繁體中文台灣在地化用詞統一、錯誤訊息全面繁中化、手繪電子簽名對帳前台即時同步展示。',
    highlights: [
      '🇹🇼 全站繁體中文台灣在地化用詞徹底統一（修正所有生硬翻譯與英文報錯）',
      '✍️ 前台「我的訂單」新增手繪簽名對帳展示欄位',
      '🛡️ 強化網路離線與 Supabase 錯誤防禦中文友善提示',
    ],
    items: [
      {
        type: 'enhancement',
        title: '全站繁體中文台灣用語在地化',
        description:
          '全面檢視並修正所有表單驗證、API 錯誤反饋、空狀態與系統通知，使用最貼近台灣日常習慣之精準用語。',
        badgeText: '在地化',
      },
      {
        type: 'feature',
        title: '前台訂單手繪簽名即時展示',
        description:
          '顧客於前台查看訂單時，若該筆訂單已完成團長手繪簽名核銷，即可直接在訂單卡片中查看簽名圖像與核對時間。',
        badgeText: '對帳功能',
      },
    ],
  },
  {
    version: 'v10.1.0',
    releaseDate: '2026-09-01',
    tag: 'Minor',
    summary: '常用客製化選項庫 (Common Customization Presets) 上線、單品與多品一鍵套用熱門規格範本。',
    highlights: [
      '📚 常用客製化選項庫：內建冷熱甜度、冰塊、加料配料、肉品熟度、辣度等通用範本',
      '💾 一鍵將自訂規格儲存至常用範本庫',
      '🔄 支援跨店家、跨商品重複引用客製化選項',
    ],
    items: [
      {
        type: 'feature',
        title: '常用客製化選項庫與熱門範本',
        description:
          '後台菜單設計提供預設客製選項庫，點擊即可一秒為飲料、便當、排餐填入標準客製化選項及加價設定。',
        badgeText: '菜單工具',
      },
    ],
  },
  {
    version: 'v10.0.0',
    releaseDate: '2026-08-31',
    tag: 'Major',
    summary: '系統維護中樞 (System Maintenance Center) 全新上線、全域/單頁即時排程維護、前台極致動態維護鎖定畫面。',
    highlights: [
      '🛠️ 系統維護中樞：支援全域或指定分頁（首頁/購物車/結帳/訂單/帳戶）維護模式',
      '🎨 2026 頂級美學維護鎖定畫面：同心發光脈衝齒輪、深色微光粒子、即時伺服器狀態儀表',
      '⏱️ 預估恢復倒數計時與可拖曳即時懸浮膠囊預覽',
    ],
    items: [
      {
        type: 'major',
        title: '全域智慧維護中樞與動態鎖定系統',
        description:
          '管理員可於後台即時啟動系統維護或設定排程，前台依據受影響分頁自動攔截並展示高質感動態維護畫面，保障資料庫升級安全。',
        badgeText: '核心系統',
      },
      {
        type: 'feature',
        title: '全方位預估倒數與伺服器健康度 Ping 儀表',
        description:
          '維護畫面內建即時伺服器延遲 (Ping) 監測與倒數計時膠囊，提供最透明流暢的維護體驗。',
        badgeText: '視覺設計',
      },
    ],
  },
  {
    version: 'v9.0.0',
    releaseDate: '2026-08-30',
    tag: 'Major',
    summary: 'Google Gemini AI 智慧菜單辨識與 OCR 結構化萃取上線，實體菜單拍照一鍵匯入為數位店家菜單。',
    highlights: [
      '🤖 Google Gemini AI 菜單圖像多模態識別',
      '⚡ 5 秒內自動萃取店家名稱、餐點分類、品項、單價與備註規格',
      '📋 智慧預覽審核表：一鍵批量校正後直接建立為店家菜單',
    ],
    items: [
      {
        type: 'major',
        title: 'Google Gemini AI 智慧菜單辨識系統',
        description:
          '只需上傳實體傳單或店家菜單照片，AI 即可自動進行 OCR 分析並結構化轉為分類與餐點，大幅縮短人工輸入時間 90% 以上。',
        badgeText: 'AI 賦能',
      },
    ],
  },
  {
    version: 'v8.0.0',
    releaseDate: '2026-08-28',
    tag: 'Minor',
    summary: '手繪電子簽名對帳系統、高解析 Canvas 簽名畫板與團長取餐核銷數位化。',
    highlights: [
      '✍️ 手繪電子簽名畫板：支援觸控筆與手指流暢繪製簽名',
      '📑 簽名圖像即時壓縮與 Supabase 雲端安全儲存',
      '🤝 對帳收據數位化：取餐核銷具備民法證明效力',
    ],
    items: [
      {
        type: 'feature',
        title: '手繪電子簽名對帳系統',
        description:
          '團長可於取餐交付時出示簽名板供成員簽名，簽名圖像自動綁定訂單並同步至後台與個人歷史紀錄中。',
        badgeText: '對帳工具',
      },
    ],
  },
  {
    version: 'v7.0.0',
    releaseDate: '2026-08-25',
    tag: 'Minor',
    summary: 'Web Speech API 智能即時語音播報系統、新訂單自訂語音廣播、團長後台接單即時語音提醒。',
    highlights: [
      '🔊 Web Speech API 原生語音合成技術：支援繁體中文自然流暢朗讀',
      '📢 新訂單即時語音廣播：「叮咚！收到來自 [暱稱] 的新訂單，共 [N] 項餐點」',
      '⚙️ 後台語音設定面板：支援調整音調、語速、音量及播報自訂範本',
    ],
    items: [
      {
        type: 'feature',
        title: '智能即時語音播報中樞',
        description:
          '後台即時監聽 Supabase 訂單事件，自動轉化為語音廣播，團長忙碌時無需盯著螢幕即可掌握即時送單狀態。',
        badgeText: '語音系統',
      },
    ],
  },
  {
    version: 'v6.0.0',
    releaseDate: '2026-08-20',
    tag: 'Minor',
    summary: '智慧外送費平攤演算系統（支援捨去/進位/四捨五入三種小數模式）、後台即時利潤與自訂手續費拆算。',
    highlights: [
      '➗ 智慧費用平攤計算機：自動均攤外送費與折扣優惠',
      '🧮 支援「無條件捨去」、「無條件進位」、「四捨五入」精準數值模式',
      '📊 團長對帳總表即時預覽每位成員應付、已付與找零金額',
    ],
    items: [
      {
        type: 'feature',
        title: '外送費平攤與小數點演算系統',
        description:
          '提供多種靈活的平攤模式，解決團購找零與零錢分攤困擾，對帳明細一清二楚。',
        badgeText: '費用演算',
      },
    ],
  },
  {
    version: 'v5.0.0',
    releaseDate: '2026-08-15',
    tag: 'Major',
    summary: 'Passkey (WebAuthn / FIDO2) 零信任生物辨識登入、Touch ID / Face ID / Windows Hello 免密碼極速認證。',
    highlights: [
      '🔑 Passkey (FIDO2 / WebAuthn) 生物辨識無密碼登入',
      '🛡️ 支援 Apple Touch ID / Face ID / Windows Hello / 實體安全金鑰',
      '⚡ 零生物特徵外洩風險：私鑰固存於裝置安全晶片',
    ],
    items: [
      {
        type: 'major',
        title: 'Passkey 零信任免密碼認證架構',
        description:
          '全站導入國際頂級 FIDO2 Passkeys 技術，使用者無需記憶繁瑣密碼，輕觸指紋或掃描臉部即可 1 秒安全登入。',
        badgeText: '資安突破',
      },
    ],
  },
  {
    version: 'v4.0.0',
    releaseDate: '2026-08-10',
    tag: 'Minor',
    summary: '全站暗黑/亮色主題切換 (Dark / Light Mode)、平滑色彩過渡與適應系統偏好。',
    highlights: [
      '🌙 深色主題 (Dark Mode) 與亮色主題 (Light Mode) 一鍵無縫切換',
      '🎨 採用專業級色彩階層與 Glassmorphism 磨砂光影效果',
      '📱 自動偵測使用者系統外觀設定並記住個人偏好',
    ],
    items: [
      {
        type: 'enhancement',
        title: '全站雙色主題系統',
        description:
          '完整適配 Tailwind CSS 深淺色系統，夜間點餐舒適護眼，白天瀏覽清晰明亮。',
        badgeText: '視覺體驗',
      },
    ],
  },
  {
    version: 'v3.0.0',
    releaseDate: '2026-08-05',
    tag: 'Minor',
    summary: '團長管理員後台接單儀表板、訂單即時狀態流轉（待處理/已付款/已完成/已取消）、營運數據統計卡片。',
    highlights: [
      '📊 團長管理員專屬後台儀表板：即時訂單流動卡片',
      '🔄 訂單狀態一鍵切換與歷史訂單歸檔管理',
      '📈 營運數據統計：今日訂單總額、餐點件數、跟團人數即時統計',
    ],
    items: [
      {
        type: 'feature',
        title: '團長後台接單與營運總覽儀表板',
        description:
          '為團長打造高效工作台，集中管理全團訂單、即時收款標記與歷史訂單匯出列印。',
        badgeText: '後台系統',
      },
    ],
  },
  {
    version: 'v2.0.0',
    releaseDate: '2026-08-01',
    tag: 'Minor',
    summary: '多店家菜單展示、多規格客製化加價彈窗、購物車暫存與送單結帳流程。',
    highlights: [
      '🏪 多店家菜單獨立分頁與分類篩選',
      '🍧 自訂加價規格彈窗：單選、多選、必填限制、自訂備註',
      '🛒 智慧購物車：支援跨品項暫存與金額即時試算',
    ],
    items: [
      {
        type: 'feature',
        title: '多規格客製化加價與購物車體系',
        description:
          '支援餐點多層客製化選項（如甜度、冰塊、加珍珠、加椰果），並提供流暢的結帳送單體驗。',
        badgeText: '點餐核心',
      },
    ],
  },
  {
    version: 'v1.0.0',
    releaseDate: '2026-07-20',
    tag: 'Major',
    summary: '咩nu 團購外送點餐平台創始版本發布、Supabase 雲端即時同步架構正式上線。',
    highlights: [
      '🎉 咩nu 團購外送點餐平台正式發布',
      '⚡ Supabase 雲端即時資料庫架構與即時訂單推播',
      '📱 PWA 行動裝置體驗最佳化與直覺化介面設計',
    ],
    items: [
      {
        type: 'major',
        title: '咩nu 平台創始版上線',
        description:
          '奠定現代化團購點餐平台基礎，提供多人即時點餐、菜單瀏覽與線上送單核心服務。',
        badgeText: '創始里程碑',
      },
    ],
  },
];
