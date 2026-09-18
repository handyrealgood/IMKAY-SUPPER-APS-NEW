/**
 * Safe LocalStorage wrapper with automatic QuotaExceededError recovery and memory fallback.
 * Prevents runtime crashes when browser storage (5MB) limit is reached.
 */

const memoryStore = new Map<string, string>();

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

export const safeStorage = {
  /**
   * Check if window.localStorage is accessible without security errors
   */
  isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__test_ls__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Safely set item into LocalStorage.
   * If quota exceeded, automatically cleans bloated base64 data and retries.
   * If still fails, falls back to in-memory store so app never crashes.
   */
  setItem(key: string, value: string): boolean {
    // Keep memory store synchronized
    memoryStore.set(key, value);

    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err: any) {
      const isQuotaError = 
        err?.name === 'QuotaExceededError' || 
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
        err?.code === 22 || 
        err?.code === 1014 ||
        String(err).toLowerCase().includes('quota');

      if (isQuotaError) {
        console.warn(`[SafeStorage] LocalStorage quota exceeded while writing key: "${key}". Attempting cleanup...`);
        
        // Clean bloated base64 strings and non-critical data
        safeStorage.cleanupBloatedStorage();

        // Retry once after cleanup
        try {
          window.localStorage.setItem(key, value);
          console.info(`[SafeStorage] Successfully saved "${key}" after storage cleanup.`);
          return true;
        } catch (retryErr) {
          console.error(`[SafeStorage] Failed to write "${key}" even after cleanup. Falling back to memory storage.`, retryErr);
          // Gracefully continue using in-memory store
          return false;
        }
      } else {
        console.warn(`[SafeStorage] Error writing "${key}" to LocalStorage:`, err);
        return false;
      }
    }
  },

  /**
   * Safely get item from LocalStorage with memory fallback.
   */
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null && item !== undefined) {
          return item;
        }
      } catch (err) {
        console.warn(`[SafeStorage] Error reading "${key}" from LocalStorage:`, err);
      }
    }
    return memoryStore.get(key) ?? null;
  },

  /**
   * Parse JSON safely with guaranteed fallback so JSON.parse never crashes the component tree.
   */
  getJSON<T>(key: string, fallback: T): T {
    try {
      const item = this.getItem(key);
      if (!item || item === 'undefined' || item === 'null') {
        return fallback;
      }
      const parsed = JSON.parse(item);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (err) {
      console.warn(`[SafeStorage] Corrupted JSON in key "${key}", safely reverting to fallback data:`, err);
      return fallback;
    }
  },

  /**
   * Serialize and store JSON safely.
   */
  setItemJSON(key: string, value: any): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[SafeStorage] Failed to stringify JSON for "${key}":`, err);
      return false;
    }
  },

  /**
   * Safely remove item.
   */
  removeItem(key: string): void {
    memoryStore.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[SafeStorage] Error removing "${key}" from LocalStorage:`, err);
      }
    }
  },

  /**
   * Safely clear storage and memory cache.
   */
  clear(): void {
    memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch (err) {
        console.warn('[SafeStorage] Error clearing LocalStorage:', err);
      }
    }
  },

  /**
   * Inspects all localStorage keys and strips giant base64 payloads (avatars, receipts, logos)
   * while preserving all essential tabular data, recipes, users, and orders.
   */
  cleanupBloatedStorage(): number {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0;
    }

    let freedBytes = 0;
    try {
      // 1. Sanitize currentUser
      const currentUserStr = this.getItem('resto_currentUser');
      if (currentUserStr && currentUserStr.length > 50000) {
        try {
          const user = JSON.parse(currentUserStr);
          if (user.avatar && user.avatar.startsWith('data:image')) {
            user.avatar = DEFAULT_AVATAR;
            const sanitized = JSON.stringify(user);
            freedBytes += (currentUserStr.length - sanitized.length);
            this.setItem('resto_currentUser', sanitized);
          }
        } catch (e) {
          console.error('[SafeStorage] Error sanitizing currentUser', e);
        }
      }

      // 2. Sanitize users list
      const usersStr = this.getItem('resto_users');
      if (usersStr && usersStr.length > 100000) {
        try {
          const users = JSON.parse(usersStr);
          if (Array.isArray(users)) {
            let modified = false;
            users.forEach((u: any) => {
              if (u.avatar && u.avatar.startsWith('data:image')) {
                u.avatar = DEFAULT_AVATAR;
                modified = true;
              }
            });
            if (modified) {
              const sanitized = JSON.stringify(users);
              freedBytes += (usersStr.length - sanitized.length);
              this.setItem('resto_users', sanitized);
            }
          }
        } catch (e) {
          console.error('[SafeStorage] Error sanitizing users', e);
        }
      }

      // 3. Sanitize branding custom logo if huge
      const brandingStr = this.getItem('resto_branding');
      if (brandingStr && brandingStr.length > 200000) {
        try {
          const branding = JSON.parse(brandingStr);
          if (branding.logoUrl && branding.logoUrl.startsWith('data:image')) {
            branding.logoUrl = '';
            branding.logoType = 'icon';
            const sanitized = JSON.stringify(branding);
            freedBytes += (brandingStr.length - sanitized.length);
            this.setItem('resto_branding', sanitized);
          }
        } catch (e) {
          console.error('[SafeStorage] Error sanitizing branding', e);
        }
      }

      // 4. Sanitize bloated attachments in pettyCash
      const pettyCashStr = this.getItem('resto_pettyCash');
      if (pettyCashStr && pettyCashStr.length > 200000) {
        try {
          const records = JSON.parse(pettyCashStr);
          if (Array.isArray(records)) {
            records.forEach((r: any) => {
              if (r.receiptUrl && r.receiptUrl.startsWith('data:image')) {
                r.receiptUrl = undefined;
              }
            });
            const sanitized = JSON.stringify(records);
            freedBytes += (pettyCashStr.length - sanitized.length);
            this.setItem('resto_pettyCash', sanitized);
          }
        } catch (e) {
          console.error('[SafeStorage] Error sanitizing pettyCash', e);
        }
      }

      // 5. Sanitize bloated attachments in receivings
      const receivingsStr = this.getItem('resto_receivings');
      if (receivingsStr && receivingsStr.length > 300000) {
        try {
          const records = JSON.parse(receivingsStr);
          if (Array.isArray(records)) {
            records.forEach((r: any) => {
              if (r.invoicePhoto && r.invoicePhoto.startsWith('data:image')) {
                r.invoicePhoto = undefined;
              }
            });
            const sanitized = JSON.stringify(records);
            freedBytes += (receivingsStr.length - sanitized.length);
            this.setItem('resto_receivings', sanitized);
          }
        } catch (e) {
          console.error('[SafeStorage] Error sanitizing receivings', e);
        }
      }
    } catch (e) {
      console.error('[SafeStorage] Failed to run cleanupBloatedStorage', e);
    }
    return freedBytes;
  },

  /**
   * Reset bloated storage keys while keeping main database
   */
  resetTemporaryCaches(): void {
    try {
      this.cleanupBloatedStorage();
    } catch (e) {
      console.error(e);
    }
  }
};
