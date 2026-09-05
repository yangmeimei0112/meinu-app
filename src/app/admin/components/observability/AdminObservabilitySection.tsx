'use client';

import React, { useState, useEffect } from 'react';
import { LiveTopologyCanvas } from './LiveTopologyCanvas';
import { LogicInspectorDrawer } from './LogicInspectorDrawer';
import { ErrorFlightRecorder } from './ErrorFlightRecorder';
import {
  telemetryHub,
  TelemetryEvent,
  TelemetryErrorRecord,
  TelemetryNodeId,
} from '@/lib/telemetry/telemetryHub';
import { Activity } from 'lucide-react';

export function AdminObservabilitySection() {
  const [events, setEvents] = useState<TelemetryEvent[]>(() => telemetryHub.getEvents());
  const [errors, setErrors] = useState<TelemetryErrorRecord[]>(() => telemetryHub.getErrors());
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(() => {
    const list = telemetryHub.getEvents();
    return list.length > 0 ? list[0] : null;
  });
  const [activeNode, setActiveNode] = useState<TelemetryNodeId | null>(null);

  useEffect(() => {
    // 訂閱遙測事件即時更新
    const unsub = telemetryHub.subscribe(() => {
      const nextEvents = telemetryHub.getEvents();
      const nextErrors = telemetryHub.getErrors();
      setEvents(nextEvents);
      setErrors(nextErrors);
      if (!selectedEvent && nextEvents.length > 0) {
        setSelectedEvent(nextEvents[0]);
      }
    });

    // 若尚無任何事件，自動觸發一次模擬讓管理者初次進入即可看見動態流
    if (telemetryHub.getEvents().length === 0) {
      telemetryHub.simulateOrderFlow();
    }

    return unsub;
  }, [selectedEvent]);

  const handleSelectNode = (node: TelemetryNodeId) => {
    setActiveNode(node);
    // 篩選出該節點最近一筆事件做為解剖對象
    const match = events.find((e) => e.node === node || e.targetNode === node);
    if (match) {
      setSelectedEvent(match);
    }
  };

  const handleSelectEvent = (event: TelemetryEvent) => {
    setSelectedEvent(event);
    setActiveNode(event.node);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 👑 頂部全景監控標題橫幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-purple-500/10 dark:from-sky-950/50 dark:via-[#0E172A] dark:to-[#18112C] rounded-3xl p-6 border border-sky-200/90 dark:border-sky-500/30 shadow-xl space-y-3">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-600" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <Activity className="w-6 h-6 text-sky-500 animate-pulse" />
                <span>全景動態可視化與運作邏輯觀測中心</span>
              </span>
              <span className="text-xs font-extrabold px-3 py-0.5 rounded-full bg-sky-500 text-white shadow-xs">
                TELEMETRY LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold mt-1">
              具象化透視整個點餐平台的所有功能執行、動態流程流動、背後運作邏輯拆解與即時故障黑盒子捕捉。
            </p>
          </div>
        </div>
      </div>

      {/* 🌐 上半部：全景拓撲動態畫布 與 運作邏輯逐步解讀儀 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <LiveTopologyCanvas
            events={events}
            errorCount={errors.length}
            activeNode={activeNode}
            onSelectNode={handleSelectNode}
          />
        </div>
        <div className="lg:col-span-5">
          <LogicInspectorDrawer
            selectedEvent={selectedEvent}
            activeNode={activeNode}
          />
        </div>
      </div>

      {/* 🚨 下半部：即時異常與故障黑盒子紀錄器 (Error Flight Recorder) */}
      <div>
        <ErrorFlightRecorder
          errors={errors}
          events={events}
          onSelectEvent={handleSelectEvent}
          selectedEventId={selectedEvent?.id || null}
        />
      </div>
    </div>
  );
}
