<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 咩nu (Meinu App) 專案核心規範與開發指引

## 1. Git Commit 與版本號管理規範
- **Commit 訊息格式**：必須遵循繁體中文版號格式：`第十之X版 (v10.X.0): 詳細中文說明` 或 `第十之X之Y版 (v10.X.Y): 詳細修復說明`。
- **版本號 4 點同步檢核**（版本發布時必須同時更新）：
  1. `package.json` (`"version": "10.X.Y"`)
  2. `src/app/changelog/changelogData.ts` (頂部新增紀錄並設 `isLatest: true`，前版改為 `false`)
  3. `src/lib/formatVersion.ts` (`CURRENT_APP_VERSION`)
  4. `src/components/VersionUpdateModal.tsx` (`CLIENT_VERSION` fallback)

## 2. Next.js 16 App Router 路由規範
- **禁止在 `route.ts` 導出非 HTTP 方法**：
  - `src/app/api/**/route.ts` 僅允許導出 `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS` 及 Next.js 認可之設定（如 `dynamic`, `revalidate`）。
  - 所有工具函數（如 `formatStoreCode`）、配置讀寫（如 `maintenanceConfig`）與 TypeScript 型別定義必須放置於 `src/lib/` 或 `src/types/`，並由 `route.ts` 匯入使用。

## 3. 品質把關與驗收標準 (Quality Gates)
在完成任何功能或修復後，必須確保以下驗證 100% 通過：
- 🧪 **E2E 自動化測試**：`node tests/e2e/runner.mjs` (184+ 項測試全數 PASS)。
- ⚡ **ESLint 靜態檢查**：`npm run lint` (0 Errors, 0 Warnings)。
- 🎯 **TypeScript 編譯檢查**：`npx tsc --noEmit` (0 Type Errors)。
- 🚀 **生產環境構建**：`npm run build` (所有 29+ 條路由編譯成功)。
