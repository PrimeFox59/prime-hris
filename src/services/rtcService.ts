// Client Service for Server RTC Time Lock & Real-Time SSE Synchronization
// Single Source of Truth for Anti-Tamper Clock and Live Multi-Device Sync

export interface ServerTimeState {
  serverTimeMs: number;
  timeDriftMs: number;
  isSynced: boolean;
  isClockTampered: boolean;
  serverWibString: string;
}

export type RealtimeEventType = 
  | 'ATTENDANCE_SAVED' 
  | 'APPROVAL_UPDATED' 
  | 'EMPLOYEE_SAVED' 
  | 'REIMBURSEMENT_SAVED' 
  | 'SALARY_RULES_UPDATED' 
  | 'DATABASE_RESET';

export interface RealtimePacket {
  type: RealtimeEventType;
  payload: any;
  serverTimeMs: number;
  serverTimestamp: string;
}

class RtcManager {
  private timeDriftMs: number = 0;
  private isSynced: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(packet: RealtimePacket) => void>> = new Map();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private isLiveConnected: boolean = false;

  constructor() {
    this.syncServerTime();
    // Re-sync authoritative server clock every 60 seconds
    this.syncTimer = setInterval(() => this.syncServerTime(), 60000);
    this.initRealtimeStream();
  }

  // ========================================================
  // 1. AUTHORITATIVE SERVER RTC CLOCK (ANTI-TAMPER)
  // ========================================================
  public async syncServerTime(): Promise<number> {
    const clientSendTime = Date.now();
    try {
      const res = await fetch('/api/server-time', { cache: 'no-store' });
      if (res.ok) {
        const clientReceiveTime = Date.now();
        const roundTripLatency = (clientReceiveTime - clientSendTime) / 2;
        const data = await res.json();
        
        // Exact NTP drift calculation
        const authoritativeServerTime = data.serverTimeMs + roundTripLatency;
        this.timeDriftMs = authoritativeServerTime - clientReceiveTime;
        this.isSynced = true;
        return this.timeDriftMs;
      }
    } catch (e) {
      console.warn('[RTC] Server clock sync fallback', e);
    }
    return this.timeDriftMs;
  }

  /**
   * Returns authoritative Date object locked to Server RTC (Asia/Jakarta WIB)
   * Prevents employees from tampering with their device clock.
   */
  public getServerNow(): Date {
    return new Date(Date.now() + this.timeDriftMs);
  }

  /**
   * Checks if employee's local device clock has been manipulated by > 90 seconds
   */
  public isDeviceClockTampered(): boolean {
    return Math.abs(this.timeDriftMs) > 90000;
  }

  public getTimeDriftSeconds(): number {
    return Math.round(this.timeDriftMs / 1000);
  }

  public formatWibClock(): string {
    const now = this.getServerNow();
    return now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';
  }

  // ========================================================
  // 2. REAL-TIME DATA SYNCHRONIZATION (SSE STREAM)
  // ========================================================
  public initRealtimeStream() {
    if (typeof window === 'undefined' || !window.EventSource) return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/realtime/stream');

      this.eventSource.addEventListener('connected', () => {
        this.isLiveConnected = true;
        this.notifyStatus(true);
      });

      this.eventSource.addEventListener('message', (event: MessageEvent) => {
        try {
          const packet: RealtimePacket = JSON.parse(event.data);
          this.dispatchPacket(packet);
        } catch (err) {
          console.error('[RTC] Failed to parse realtime packet', err);
        }
      });

      this.eventSource.onerror = () => {
        this.isLiveConnected = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      console.warn('[RTC] EventSource initialization failed, fallback to polling', err);
      this.isLiveConnected = false;
      this.notifyStatus(false);
    }
  }

  public subscribe(eventType: RealtimeEventType | '*', callback: (packet: RealtimePacket) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.isLiveConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public getIsConnected(): boolean {
    return this.isLiveConnected;
  }

  private dispatchPacket(packet: RealtimePacket) {
    // Specific listeners
    const specificListeners = this.listeners.get(packet.type);
    if (specificListeners) {
      specificListeners.forEach(cb => cb(packet));
    }
    // Wildcard listeners
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(cb => cb(packet));
    }
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach(cb => cb(connected));
  }
}

export const rtcService = new RtcManager();
