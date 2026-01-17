// 記憶體儲存 - 用於 Vercel 等無伺服器環境
// 注意: 資料不會持久化，每次部署或冷啟動會重置

interface MemoryStore {
  [key: string]: any[];
}

class MemoryDB {
  private store: MemoryStore = {};
  private initialized = false;

  private async initializeStore() {
    if (this.initialized) return;
    
    // 初始化預設資料
    const { getDefaultData } = await import('./seed');
    const defaultData = await getDefaultData();
    
    this.store = {
      'users.json': defaultData.users,
      'jobs.json': defaultData.jobs,
      'rewards.json': defaultData.rewards,
      'transactions.json': defaultData.transactions,
    };
    
    this.initialized = true;
  }

  async read<T>(filename: string): Promise<T[]> {
    await this.initializeStore();
    return (this.store[filename] || []) as T[];
  }

  async write<T>(filename: string, data: T[]): Promise<void> {
    await this.initializeStore();
    this.store[filename] = data;
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

export const memoryDB = new MemoryDB();
