/**
 * TODO: move to utils project
 */
export class LocalStorageCache {
    constructor(protected namespace = 'APP') {}
    
    clear() {
      localStorage.removeItem(this.namespace)
    }
  
    get(key: string, allowExpired = false) {
      const entry = this.getEntry(key, allowExpired);
      return entry ? entry.__value : undefined;
    }
  
    remove(key: string) {
      const data = this.getStorage();
      data[key] = undefined;
      delete data[key];
      this.save(data);
    }
  
    isSet(key: string, allowExpired = false) {
      return this.getEntry(key, allowExpired) !== undefined;
    }

    set(key: string, value: any, ttlMs?: number) {
      const data = this.getStorage();
      const expiresAt = typeof ttlMs === 'number' ? Date.now() + ttlMs : undefined;
      data[key] = this.wrapEntry(value, expiresAt);
      this.save(data);
    }
  
    private getStorage() {
      const storage = localStorage.getItem(this.namespace);
      if (storage) return this.deserialize(storage);
      return {};
    }

    private getEntry(key: string, allowExpired = false) {
      const data = this.getStorage();
      const raw = data[key];
      if (raw === undefined) return undefined;

      const entry = this.unwrapEntry(raw);
      if (!entry.__expiresAt || entry.__expiresAt > Date.now()) return entry;

      if (allowExpired) return entry;
      return undefined;
    }

    private wrapEntry(value: any, expiresAt?: number) {
      return {
        __value: value,
        __expiresAt: expiresAt,
      };
    }

    private unwrapEntry(value: any) {
      if (value && typeof value === 'object' && '__value' in value) {
        return value as { __value: any; __expiresAt?: number };
      }

      return { __value: value };
    }
  
    private serialize(value: any) {
      return JSON.stringify(value);
    }
  
    private deserialize(value: any) {
      return JSON.parse(value);
    }
  
    private save(data: any) {
      localStorage.setItem(this.namespace, this.serialize(data));
    }
  }
  