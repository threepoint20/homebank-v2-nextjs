import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// JSON 檔案系統資料庫（本地開發用）
export class JsonDB {
  private async ensureDataDir() {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  private async ensureFile(filename: string, defaultData: any = []) {
    await this.ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  async read<T>(filename: string, bustCache?: boolean): Promise<T[]> {
    await this.ensureFile(filename);
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async write<T>(filename: string, data: T[]): Promise<void> {
    await this.ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
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
}

// 資料庫介面
export interface Database {
  read<T>(filename: string, bustCache?: boolean): Promise<T[]>;
  write<T>(filename: string, data: T[]): Promise<void>;
  findOne<T extends { id: string }>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T | null>;
  findMany<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T[]>;
  create<T extends { id: string }>(filename: string, item: T): Promise<T>;
  update<T extends { id: string }>(
    filename: string,
    id: string,
    updates: Partial<T> | Record<string, any>
  ): Promise<T | null>;
  delete<T extends { id: string }>(
    filename: string,
    id: string
  ): Promise<boolean>;
}

// 根據環境自動選擇資料庫
function getDatabase(): Database {
  // 優先使用 Vercel Blob
  const useBlob = process.env.BLOB_READ_WRITE_TOKEN !== undefined;
  
  if (useBlob) {
    // 動態載入 Blob 資料庫
    try {
      const { blobDB } = require('./blob-store');
      console.log('✅ 使用 Vercel Blob 資料庫');
      return blobDB;
    } catch (error) {
      console.warn('⚠️ Blob 資料庫載入失敗，使用 JSON 檔案系統', error);
      return new JsonDB();
    }
  }
  
  // 檢查是否使用 KV（向後相容）
  const useKV = process.env.KV_REST_API_URL !== undefined;
  
  if (useKV) {
    try {
      const { kvDB } = require('./kv-store');
      console.log('✅ 使用 Vercel KV 資料庫');
      return kvDB;
    } catch (error) {
      console.warn('⚠️ KV 資料庫載入失敗，使用 JSON 檔案系統', error);
      return new JsonDB();
    }
  }
  
  console.log('✅ 使用本地 JSON 檔案系統');
  return new JsonDB();
}

export const db = getDatabase();
