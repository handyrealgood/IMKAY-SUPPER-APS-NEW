/**
 * Real-time Database Synchronization Service for LAN & Cloud.
 * Bridges all connected devices (PC Kasir, Manager, Waiter Phone, Kitchen Display)
 * to the central server database in real-time.
 */

export interface SyncPayload {
  key?: string | null;
  data?: any;
  updates?: Record<string, any> | null;
  revision: number;
  originId?: string | null;
  lastUpdated: string;
}

export type SyncCallback = (payload: SyncPayload) => void;

class DbSyncService {
  public clientId: string;
  private listeners: Set<SyncCallback> = new Set();
  private eventSource: EventSource | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private fallbackPollTimer: any = null;
  private lastRevision: number = 0;
  private lastSyncDate: Date | null = null;
  private activeDeviceCount: number = 1;
  private statusListeners: Set<(connected: boolean, devices: number) => void> = new Set();

  constructor() {
    this.clientId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      lastRevision: this.lastRevision,
      lastSyncDate: this.lastSyncDate,
      activeDeviceCount: this.activeDeviceCount,
      clientId: this.clientId
    };
  }

  public onStatusChange(fn: (connected: boolean, devices: number) => void) {
    this.statusListeners.add(fn);
    fn(this.isConnected, this.activeDeviceCount);
    return () => {
      this.statusListeners.delete(fn);
    };
  }

  private notifyStatus(connected: boolean, devices: number) {
    this.isConnected = connected;
    this.activeDeviceCount = devices;
    this.statusListeners.forEach(fn => {
      try {
        fn(connected, devices);
      } catch (err) {
        console.error('[DbSync] Error in status callback:', err);
      }
    });
  }

  /**
   * Fetch full database state from server.
   */
  public async fetchFullState(): Promise<{ revision: number; data: Record<string, any> } | null> {
    try {
      const res = await fetch('/api/db/state', {
        headers: { 'X-Client-Id': this.clientId },
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) {
        this.lastRevision = json.revision || 1;
        this.lastSyncDate = new Date();
        this.notifyStatus(true, json.connectedClients || 1);
        return { revision: json.revision, data: json.data };
      }
      return null;
    } catch (err) {
      console.warn('[DbSync] Could not reach server database (offline or server not started):', err);
      this.notifyStatus(false, 1);
      return null;
    }
  }

  /**
   * Push single key update to server database and all other LAN devices.
   */
  public async pushUpdate(key: string, data: any): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': this.clientId
        },
        body: JSON.stringify({
          key,
          data,
          originId: this.clientId
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.lastRevision = json.revision;
          this.lastSyncDate = new Date();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn(`[DbSync] Failed to sync "${key}" to server:`, err);
      return false;
    }
  }

  /**
   * Push batch updates to server database.
   */
  public async pushBatch(updates: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': this.clientId
        },
        body: JSON.stringify({
          updates,
          originId: this.clientId
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.lastRevision = json.revision;
          this.lastSyncDate = new Date();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('[DbSync] Failed to batch sync to server:', err);
      return false;
    }
  }

  /**
   * Seed server with initial data if server database is still empty.
   */
  public async seedServerIfEmpty(data: Record<string, any>): Promise<Record<string, any> | null> {
    try {
      const res = await fetch('/api/db/init-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': this.clientId
        },
        body: JSON.stringify({
          data,
          originId: this.clientId
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.lastRevision = json.revision;
          return json.data;
        }
      }
      return null;
    } catch (err) {
      console.warn('[DbSync] Could not seed server:', err);
      return null;
    }
  }

  /**
   * Connect to real-time Server-Sent Events (SSE) stream.
   */
  public startRealtimeSync(onUpdate: SyncCallback) {
    this.listeners.add(onUpdate);

    if (this.eventSource || this.isConnecting) {
      return;
    }

    this.connectSse();
    this.startFallbackPolling();
  }

  public stopRealtimeSync(onUpdate: SyncCallback) {
    this.listeners.delete(onUpdate);
    if (this.listeners.size === 0) {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.fallbackPollTimer) {
        clearInterval(this.fallbackPollTimer);
        this.fallbackPollTimer = null;
      }
      this.isConnecting = false;
      this.isConnected = false;
    }
  }

  private connectSse() {
    if (typeof window === 'undefined' || !('EventSource' in window)) {
      return;
    }

    this.isConnecting = true;
    try {
      const es = new EventSource('/api/db/events');
      this.eventSource = es;

      es.addEventListener('connected', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          this.isConnecting = false;
          this.notifyStatus(true, payload.connectedClients || 1);
          if (payload.revision && payload.revision > this.lastRevision) {
            this.triggerFullSync();
          }
        } catch {}
      });

      es.addEventListener('sync', (e: MessageEvent) => {
        try {
          const payload: SyncPayload = JSON.parse(e.data);
          // If this update was originated by this exact browser tab, skip it
          if (payload.originId && payload.originId === this.clientId) {
            return;
          }
          this.lastRevision = payload.revision;
          this.lastSyncDate = new Date();
          this.notifyStatus(true, this.activeDeviceCount);
          this.listeners.forEach(fn => fn(payload));
        } catch (err) {
          console.error('[DbSync] Error parsing SSE sync event:', err);
        }
      });

      es.addEventListener('sync-all', (e: MessageEvent) => {
        try {
          const payload: SyncPayload = JSON.parse(e.data);
          if (payload.originId && payload.originId === this.clientId) {
            return;
          }
          this.lastRevision = payload.revision;
          this.lastSyncDate = new Date();
          this.notifyStatus(true, this.activeDeviceCount);
          this.listeners.forEach(fn => fn(payload));
        } catch (err) {
          console.error('[DbSync] Error parsing SSE sync-all event:', err);
        }
      });

      es.addEventListener('ping', () => {
        this.notifyStatus(true, this.activeDeviceCount);
      });

      es.onerror = () => {
        this.isConnecting = false;
        this.notifyStatus(false, 1);
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto reconnect in 4 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSse();
          }, 4000);
        }
      };
    } catch (err) {
      console.warn('[DbSync] Failed to initialize EventSource:', err);
      this.isConnecting = false;
      this.notifyStatus(false, 1);
    }
  }

  /**
   * Fallback periodic polling in case SSE is blocked by mobile browser power saving or proxy.
   */
  private startFallbackPolling() {
    if (this.fallbackPollTimer) return;
    this.fallbackPollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          this.notifyStatus(true, json.connectedClients || 1);
          if (json.revision && json.revision > this.lastRevision) {
            this.triggerFullSync();
          }
        }
      } catch {
        this.notifyStatus(false, 1);
      }
    }, 8000); // Check every 8s
  }

  private async triggerFullSync() {
    const full = await this.fetchFullState();
    if (full && full.data) {
      const payload: SyncPayload = {
        revision: full.revision,
        updates: full.data,
        lastUpdated: new Date().toISOString()
      };
      this.listeners.forEach(fn => fn(payload));
    }
  }
}

export const dbSync = new DbSyncService();
