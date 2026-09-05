'use client';

export type TelemetryNodeId =
  | 'customer'
  | 'gateway'
  | 'logic'
  | 'database'
  | 'realtime'
  | 'audio';

export interface LogicStep {
  step: number;
  title: string;
  desc: string;
  status: 'done' | 'active' | 'fail';
  detail?: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  timeMs: number;
  node: TelemetryNodeId;
  targetNode?: TelemetryNodeId;
  action: string;
  title: string;
  status: 'info' | 'success' | 'warning' | 'error';
  detail: string;
  formula?: string;
  logicSteps?: LogicStep[];
  payload?: any;
}

export interface TelemetryErrorRecord {
  id: string;
  timestamp: string;
  timeMs: number;
  node: TelemetryNodeId;
  category: string;
  action: string;
  message: string;
  stack?: string;
  payloadSnapshot?: any;
  aiSuggestion?: string;
}

type Listener = () => void;

class TelemetryHub {
  private events: TelemetryEvent[] = [];
  private errors: TelemetryErrorRecord[] = [];
  private listeners: Set<Listener> = new Set();
  private maxEvents = 100;
  private maxErrors = 50;
  private isInitialized = false;

  constructor() {
    this.initGlobalErrorHandlers();
  }

  private initGlobalErrorHandlers() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // 攔截未處理之 JavaScript 執行期異常
    window.addEventListener('error', (event) => {
      this.recordError({
        node: 'customer',
        category: 'Runtime Exception',
        action: '瀏覽器全域執行期異常',
        message: event.message || '未知錯誤',
        stack: event.error?.stack,
        aiSuggestion: '建議檢查該元件之生命週期與非空防護 (Nullish Coalescing)，防止未定義屬性存取。',
      });
    });

    // 攔截未處理之 Promise Rejection
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || '非同步操作未捕捉之拒絕';
      this.recordError({
        node: 'gateway',
        category: 'Unhandled Promise',
        action: '非同步請求未捕捉拒絕',
        message: msg,
        stack: reason?.stack,
        aiSuggestion: '建議在該非同步 API 或 Promise 呼叫鏈加上 try...catch 或 .catch() 區塊。',
      });
    });
  }

  public recordEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp' | 'timeMs'>): TelemetryEvent {
    const now = new Date();
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toLocaleTimeString('zh-TW', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0'),
      timeMs: Date.now(),
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    if (event.status === 'error') {
      this.recordError({
        node: event.node,
        category: 'Business Error',
        action: event.action,
        message: event.detail,
        payloadSnapshot: event.payload,
        aiSuggestion: '請參閱運作邏輯步驟，確認傳入之 Payload 格式與資料庫連線狀態。',
      });
    }

    this.notify();
    return fullEvent;
  }

  public recordError(error: Omit<TelemetryErrorRecord, 'id' | 'timestamp' | 'timeMs'>): TelemetryErrorRecord {
    const now = new Date();
    const fullError: TelemetryErrorRecord = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toLocaleTimeString('zh-TW', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0'),
      timeMs: Date.now(),
    };

    this.errors.unshift(fullError);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    this.notify();
    return fullError;
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public getErrors(): TelemetryErrorRecord[] {
    return [...this.errors];
  }

  public clearAll(): void {
    this.events = [];
    this.errors = [];
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Telemetry subscriber callback error:', err);
      }
    });
  }

  /**
   * 🌟 模擬產生一套完整且生動的「顧客下單 ➔ 邏輯運算 ➔ 資料庫寫入 ➔ 語音播報」全流程光點事件
   */
  public simulateOrderFlow() {
    const orderNumber = `MN-${Math.floor(100 + Math.random() * 900)}`;
    const nickname = ['小明', '宜靜', '大雄', '胖虎', '小夫'][Math.floor(Math.random() * 5)];
    const items = ['珍珠奶茶 (半糖少冰)', '排骨便當 (加滷蛋)', '冰美式咖啡', '雞腿便當'][Math.floor(Math.random() * 4)];
    const amount = 85 + Math.floor(Math.random() * 50);

    // 1. 顧客送單
    this.recordEvent({
      node: 'customer',
      targetNode: 'gateway',
      action: '顧客提交訂單',
      title: `${nickname} 送出訂單 (${orderNumber})`,
      status: 'info',
      detail: `顧客 ${nickname} 送出 ${items}，手繪對帳簽名已附帶，送出至 API 閘道。`,
      payload: { orderNumber, nickname, items, amount, payment: 'LINE Pay' },
      logicSteps: [
        { step: 1, title: '驗證必填欄位', desc: '檢查點餐暱稱、付款方式與缺貨處理備案皆不為空', status: 'done' },
        { step: 2, title: '生成流水單號', desc: `依據團購活動產生單號 ${orderNumber}`, status: 'done' },
        { step: 3, title: '手繪簽名打包', desc: '將 Canvas 繪圖路徑轉換為 DataURL 附加於簽名資料', status: 'done' },
      ],
    });

    // 2. 商業邏輯
    setTimeout(() => {
      this.recordEvent({
        node: 'logic',
        targetNode: 'database',
        action: '金額累加與規格解析',
        title: `動態加價計算: 總計 $${amount} 元`,
        status: 'success',
        detail: `解析客製化甜度冰塊與配料加價，公式: 原價 + 選項加價 = $${amount}。`,
        formula: `Total = BasePrice(${amount - 20}) + OptionPrice(20) = $${amount}`,
        logicSteps: [
          { step: 1, title: '客製規格拆解', desc: '拆解單選甜度冰塊 (+$0) 與加料 (+$20)', status: 'done' },
          { step: 2, title: '狀態機初始化', desc: '設定初始進度為 pending (等待團長接單)', status: 'done' },
          { step: 3, title: '啟動 60 秒限時退單計時器', desc: '記錄下單時間戳記，允許 1 分鐘內自主退回購物車', status: 'done' },
        ],
      });
    }, 400);

    // 3. PostgreSQL 寫入
    setTimeout(() => {
      this.recordEvent({
        node: 'database',
        targetNode: 'realtime',
        action: 'PostgreSQL 事務寫入',
        title: `寫入 order_submissions & order_items`,
        status: 'success',
        detail: `成功將訂單 ${orderNumber} 及明細持久化至 Supabase PostgreSQL 資料表。`,
        logicSteps: [
          { step: 1, title: '寫入 order_submissions 主表', desc: `插入單號 ${orderNumber}、金額 $${amount}、狀態 pending`, status: 'done' },
          { step: 2, title: '寫入 order_items 明細表', desc: `插入餐點 ${items}、數量 1、單價 $${amount}`, status: 'done' },
          { step: 3, title: '更新本地 SWR 快取', desc: '將訂單快照同步寫入 localStorage menu_app_cached_orders_detail', status: 'done' },
        ],
      });
    }, 800);

    // 4. Realtime 推播 & 語音播報
    setTimeout(() => {
      this.recordEvent({
        node: 'realtime',
        targetNode: 'audio',
        action: 'Realtime 廣播 & 語音合成',
        title: `廣播新訂單事件 ➔ 臺灣國語播報`,
        status: 'success',
        detail: `觸發 Supabase Realtime channel.send，後台自動播放: "新訂單通知！${nickname} 點了 ${items}"。`,
        logicSteps: [
          { step: 1, title: 'Supabase Realtime 廣播', desc: '發送 INSERT 事件至 menu_orders_channel 頻道', status: 'done' },
          { step: 2, title: '後台工作台即時刷新', desc: '無重整自動將卡片加入接單清單頂部', status: 'done' },
          { step: 3, title: '臺灣國語語音合成 (TTS)', desc: `匹配 zh-TW 語音庫，播放 "${nickname} 點了 ${items}，總計 ${amount} 元"`, status: 'done' },
        ],
      });
    }, 1200);
  }

  /**
   * 🌟 模擬產生一套外送費 / 折扣平攤運算
   */
  public simulateFeeSplit() {
    const count = 4;
    const fee = 100;
    const discount = 20;
    const share = Math.floor((fee - discount) / count);

    this.recordEvent({
      node: 'logic',
      targetNode: 'database',
      action: '外送費與折扣平攤演算法',
      title: `執行金流平攤: 每人分攤 $${share} 元`,
      status: 'info',
      detail: `外送費 $${fee} 元，折扣 $${discount} 元，共 ${count} 人分攤，採用無條件捨去 (Floor) 規則。`,
      formula: `PerPersonShare = floor((${fee} - ${discount}) / ${count}) = floor(80 / 4) = $${share} 元`,
      logicSteps: [
        { step: 1, title: '統計分攤總人數', desc: `獲取當前活動有效訂單數量 N = ${count}`, status: 'done' },
        { step: 2, title: '計算淨外送費', desc: `NetFee = Fee($${fee}) - Discount($${discount}) = $${fee - discount}`, status: 'done' },
        { step: 3, title: '套用捨去演算法 (Floor)', desc: `Math.floor(80 / 4) = $${share}`, status: 'done' },
        { step: 4, title: '批次更新 final_amount', desc: '將每位成員實付金額調整為 Base + Share', status: 'done' },
      ],
    });
  }

  /**
   * 🌟 模擬產生異常錯誤事件
   */
  public simulateMockError() {
    this.recordError({
      node: 'gateway',
      category: 'API 逾時警報',
      action: 'POST /api/stores/code 逾時',
      message: 'NetworkTimeout: 伺服端無回應超過 5000ms',
      payloadSnapshot: { storeId: 'store-mock-test', timeout: 5000 },
      aiSuggestion: '請確認網路連線穩定性，或檢查 Supabase 伺服器端狀態與連線集區 (Connection Pool)。',
    });
  }
}

export const telemetryHub = new TelemetryHub();
