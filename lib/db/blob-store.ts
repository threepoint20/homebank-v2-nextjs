import { put, del, list } from '@vercel/blob';

/**
 * Vercel Blob 資料庫層
 * 
 * 架構說明：
 * - 使用 Vercel Blob Storage 作為 JSON 檔案儲存
 * - 每個檔案儲存一個資料表（users.json, jobs.json 等）
 * - CRUD 操作採用「讀取全部 -> 修改記憶體 -> 寫回全部」模式
 * 
 * 效能優化：
 * 1. URL 快取：將 Blob URL 快取在記憶體中，減少 list API 呼叫
 *    - 首次讀取：2 次請求（list + fetch）
 *    - 後續讀取：1 次請求（fetch）
 *    - 適用於 Serverless 熱啟動場景
 * 
 * 2. 寫入優化：使用 put 自動覆蓋，無需手動刪除
 *    - 減少 2 次網路請求（list + del）
 *    - 寫入速度提升約 50%
 * 
 * 已知限制：
 * 1. 並發問題 (Race Condition)：
 *    - 多個請求同時修改同一檔案時，後完成的會覆蓋先完成的修改
 *    - 建議：對於高並發場景，應改用支援事務的資料庫（如 PostgreSQL）
 * 
 * 2. 效能瓶頸：
 *    - 每次修改都需要讀寫整個檔案
 *    - 隨著資料量增加，效能會下降
 *    - 建議：資料量大時（>1000 筆）應改用專業資料庫
 * 
 * 3. 快取失效：
 *    - URL 快取在 Serverless 冷啟動時會清空
 *    - 寫入後會自動更新快取
 * 
 * 4. 適用場景：
 *    - 小型應用（<100 用戶）
 *    - 低並發場景
 *    - 原型開發和測試
 */
class BlobDatabase {
  // URL 快取：記憶體中儲存檔案名稱到 Blob URL 的映射
  private urlCache: Map<string, string> = new Map();

  private getKey(filename: string): string {
    return `homebank/${filename}`;
  }

  /**
   * 取得 Blob URL（帶快取）
   * 
   * 優化說明：
   * - 首次呼叫：從 Vercel Blob list API 查詢 URL 並快取
   * - 後續呼叫：直接從記憶體快取返回
   * - 快取在 Serverless 實例生命週期內有效
   * 
   * @param filename 檔案名稱
   */
  private async getBlobUrl(filename: string): Promise<string | null> {
    // 1. 先檢查快取
    if (this.urlCache.has(filename)) {
      const cachedUrl = this.urlCache.get(filename)!;
      console.log(`📦 使用快取的 URL: ${filename}`);
      return cachedUrl;
    }

    const key = this.getKey(filename);
    try {
      // 2. 使用 list 來檢查檔案是否存在
      const { blobs } = await list({ prefix: key, limit: 1 });
      
      if (blobs.length === 0) {
        return null;
      }
      
      // 3. 寫入快取並回傳
      const url = blobs[0].url;
      this.urlCache.set(filename, url);
      console.log(`🔍 查詢並快取 URL: ${filename}`);
      return url;
    } catch (error: any) {
      console.error(`取得 Blob URL 失敗 (${filename}):`, error);
      return null;
    }
  }

  async read<T>(filename: string): Promise<T[]> {
    try {
      // 嘗試從 Blob 讀取
      const blobUrl = await this.getBlobUrl(filename);
      
      if (!blobUrl) {
        // 如果檔案不存在，返回空陣列
        console.log(`� ${filename} 不存在，返回空陣列`);
        return [];
      }

      const response = await fetch(blobUrl);
      if (!response.ok) {
        // 如果是 404，代表檔案可能已被外部刪除，應清除快取
        // 這樣下次讀取時會重新呼叫 list API 查詢最新狀態
        if (response.status === 404) {
          this.urlCache.delete(filename);
          console.log(`🗑️ 檔案不存在，清除快取: ${filename}`);
        }
        console.error(`❌ 讀取 ${filename} 失敗: HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`✅ 成功讀取 ${filename}, 項目數: ${data.length}`);
      return data;
    } catch (error) {
      console.error(`❌ 讀取 ${filename} 發生錯誤:`, error);
      return [];
    }
  }

  /**
   * 寫入資料到 Blob Storage
   * 
   * 優化說明：
   * - 移除了「先刪除再上傳」的邏輯
   * - 使用 put() 的 addRandomSuffix: false 參數，自動覆蓋同名檔案
   * - 減少 2 次網路請求（list + del），提升約 50% 寫入效能
   * - 寫入後自動更新 URL 快取
   */
  async write<T>(filename: string, data: T[]): Promise<void> {
    const key = this.getKey(filename);
    
    try {
      // 將資料轉換為 JSON 字串
      const jsonString = JSON.stringify(data, null, 2);

      // 上傳到 Vercel Blob
      // addRandomSuffix: false 會自動覆蓋同名檔案，不需要手動刪除
      const result = await put(key, jsonString, {
        access: 'public',
        addRandomSuffix: false, // 使用固定檔名，自動覆蓋舊檔案
        contentType: 'application/json',
        cacheControlMaxAge: 0, // 不快取，確保總是讀取最新資料
      });

      // 更新快取，這樣下次讀取時就不用再 list 了
      this.urlCache.set(filename, result.url);
      
      console.log(`✅ 成功寫入 ${filename}, 項目數: ${data.length}`);
    } catch (error: any) {
      console.error(`❌ 寫入 ${filename} 失敗:`, error);
      console.error('錯誤詳情:', {
        message: error?.message,
        stack: error?.stack,
        key,
        dataLength: data.length
      });
      throw error;
    }
  }

  async findOne<T extends { id: string }>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T | null> {
    const items = await this.read<T>(filename);
    return items.find(predicate) || null;
  }

  async findMany<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const items = await this.read<T>(filename);
    return items.filter(predicate);
  }

  async create<T extends { id: string }>(
    filename: string,
    item: T
  ): Promise<T> {
    const items = await this.read<T>(filename);
    items.push(item);
    await this.write(filename, items);
    return item;
  }

  async update<T extends { id: string }>(
    filename: string,
    id: string,
    updates: Partial<T> | Record<string, any>
  ): Promise<T | null> {
    const items = await this.read<T>(filename);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates } as T;
    await this.write(filename, items);
    return items[index];
  }

  async delete<T extends { id: string }>(
    filename: string,
    id: string
  ): Promise<boolean> {
    const items = await this.read<T>(filename);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    
    await this.write(filename, filtered);
    return true;
  }

  // 初始化資料庫（僅在首次使用時）
  async initialize(force: boolean = false) {
    const { getDefaultData } = await import('./seed');
    const defaultData = await getDefaultData();
    
    // 檢查是否已初始化
    const users = await this.read('users.json');
    if (users.length === 0 || force) {
      await this.write('users.json', defaultData.users);
      await this.write('jobs.json', defaultData.jobs);
      await this.write('rewards.json', defaultData.rewards);
      await this.write('transactions.json', defaultData.transactions);
      console.log('✅ Blob 資料庫初始化完成！');
      return true;
    }
    console.log('ℹ️ 資料庫已存在，跳過初始化');
    return false;
  }

  /**
   * 清空所有資料（謹慎使用）
   * 
   * 注意：此方法會刪除所有資料檔案，無法復原
   * 建議只在開發環境或重置測試資料時使用
   */
  async clearAll() {
    const files = ['users.json', 'jobs.json', 'rewards.json', 'transactions.json'];
    
    for (const file of files) {
      try {
        const blobUrl = await this.getBlobUrl(file);
        if (blobUrl) {
          await del(blobUrl);
          // 清除快取
          this.urlCache.delete(file);
          console.log(`🗑️ 已刪除 ${file}`);
        }
      } catch (error) {
        console.error(`❌ 刪除 ${file} 失敗:`, error);
      }
    }
  }
}

export const blobDB = new BlobDatabase();
