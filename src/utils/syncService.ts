import { AppState, AppUser, AuditAction, AuditLogEntry, AuditModule } from '../types';

export function getDeviceType(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua) || window.innerWidth < 768) {
    return 'Mobile';
  }
  return 'Desktop';
}

export interface SyncResponse {
  success: boolean;
  data?: AppState;
  auditLogs?: AuditLogEntry[];
  version?: number;
  serverTime?: string;
  error?: string;
}

/**
 * Fetch application state and audit logs from server
 */
export async function fetchAppDataFromServer(): Promise<SyncResponse> {
  try {
    const res = await fetch('/api/app-data', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn('[SyncService] Fetch from server failed (using local cache):', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Push application state to server for cross-device sync
 */
export async function saveAppDataToServer(state: AppState): Promise<{ success: boolean; version?: number }> {
  try {
    const res = await fetch('/api/app-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
    const json = await res.json();
    return { success: !!json?.success, version: json?.version };
  } catch (err: any) {
    console.warn('[SyncService] Save to server failed:', err.message);
    return { success: false };
  }
}

/**
 * Push an audit log to server
 */
export async function pushAuditLogToServer(log: AuditLogEntry): Promise<boolean> {
  try {
    const res = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(log)
    });
    const json = await res.json();
    return !!json?.success;
  } catch (err) {
    return false;
  }
}

/**
 * Helper to build an AuditLogEntry
 */
export function buildAuditLog(params: {
  currentUser?: AppUser | null;
  action: AuditAction;
  module: AuditModule;
  details: string;
  itemCode?: string;
  itemName?: string;
  deptCode?: string;
  year?: number;
  oldValue?: any;
  newValue?: any;
}): AuditLogEntry {
  const user = params.currentUser;
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'guest',
    userName: user?.name || (user?.deptCode ? `User Dept ${user.deptCode}` : 'Pengguna Tamu'),
    userEmail: user?.email || '-',
    userRole: user?.role || 'dept_user',
    userDept: user?.deptCode || params.deptCode || '',
    action: params.action,
    module: params.module,
    itemCode: params.itemCode,
    itemName: params.itemName,
    deptCode: params.deptCode || user?.deptCode,
    year: params.year,
    details: params.details,
    device: getDeviceType(),
    oldValue: params.oldValue,
    newValue: params.newValue
  };
}

/**
 * Fetch all audit logs from server
 */
export async function fetchAuditLogsFromServer(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    return [];
  }
}

/**
 * Clear all audit logs on server (Admin only)
 */
export async function clearAuditLogsFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/audit-logs', { method: 'DELETE' });
    const json = await res.json();
    return !!json?.success;
  } catch (err) {
    return false;
  }
}
