import { kv } from '@vercel/kv';
import { Database } from './index';

// Vercel KV 資料庫層
class KVDatabase implements Database {
  private getKey(filename: string): string {
    return `homebank:${filename}`;
  }

  async read<T>(filename: string): Promise<T[]> {
    const key = this.getKey(filename);
    const data = await kv.get<T[]>(key);
    
    if (!data) {
      // 如果資料不存在，初始化為空陣列
      await kv.set(key, []);
      return [];
    }
    
    return data;
  }

  async write<T>(filename: string, data: T[]): Promise<void> {
    const key = this.getKey(filename);
    await kv.set(key, data);
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
    const defaultData = await getDefaultData();
    
    // 檢查是否已初始化
    const users = await this.read('users.json');
    if (users.length === 0) {
      await this.write('users.json', defaultData.users);
      await this.write('jobs.json', defaultData.jobs);
      await this.write('rewards.json', defaultData.rewards);
      await this.write('transactions.json', defaultData.transactions);
      console.log('✅ KV 資料庫初始化完成！');
    }
  }
}

export const kvDB = new KVDatabase();
