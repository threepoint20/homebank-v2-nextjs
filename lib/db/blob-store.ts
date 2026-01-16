import { put, head, del } from '@vercel/blob';

// Vercel Blob 資料庫層
class BlobDatabase {
  private getKey(filename: string): string {
    return `homebank/${filename}`;
  }

  private async getBlobUrl(filename: string): Promise<string | null> {
    const key = this.getKey(filename);
    try {
      const blob = await head(key);
      return blob?.url || null;
    } catch (error) {
      return null;
    }
  }

  async read<T>(filename: string): Promise<T[]> {
    const key = this.getKey(filename);
    
    try {
      // 嘗試從 Blob 讀取
      const blobUrl = await this.getBlobUrl(filename);
      
      if (!blobUrl) {
        // 如果檔案不存在，返回空陣列
        return [];
      }

      const response = await fetch(blobUrl);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`讀取 ${filename} 失敗:`, error);
      return [];
    }
  }

  async write<T>(filename: string, data: T[]): Promise<void> {
    const key = this.getKey(filename);
    
    try {
      // 將資料轉換為 JSON 字串
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 上傳到 Vercel Blob
      await put(key, blob, {
        access: 'public',
        addRandomSuffix: false,
      });
    } catch (error) {
      console.error(`寫入 ${filename} 失敗:`, error);
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
    updates: Partial<T>
  ): Promise<T | null> {
    const items = await this.read<T>(filename);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
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
  async initialize() {
    const { getDefaultData } = await import('./seed');
    const defaultData = getDefaultData();
    
    // 檢查是否已初始化
    const users = await this.read('users.json');
    if (users.length === 0) {
      await this.write('users.json', defaultData.users);
      await this.write('jobs.json', defaultData.jobs);
      await this.write('rewards.json', defaultData.rewards);
      await this.write('transactions.json', defaultData.transactions);
      console.log('✅ Blob 資料庫初始化完成！');
    }
  }

  // 清空所有資料（謹慎使用）
  async clearAll() {
    const files = ['users.json', 'jobs.json', 'rewards.json', 'transactions.json'];
    
    for (const file of files) {
      const key = this.getKey(file);
      try {
        await del(key);
      } catch (error) {
        console.error(`刪除 ${file} 失敗:`, error);
      }
    }
  }
}

export const blobDB = new BlobDatabase();
