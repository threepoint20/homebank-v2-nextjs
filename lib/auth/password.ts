import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12; // 高安全性的 salt rounds

  /**
   * 雜湊密碼
   */
  static async hash(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      console.error('密碼雜湊失敗:', error);
      throw new Error('密碼處理失敗');
    }
  }

  /**
   * 驗證密碼
   */
  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('密碼驗證失敗:', error);
      return false;
    }
  }

  /**
   * 驗證密碼強度
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-100
  } {
    const errors: string[] = [];
    let score = 0;

    // 基本長度檢查（只要求 6 個字元以上）
    if (password.length < 6) {
      errors.push('密碼至少需要 6 個字元');
    } else if (password.length >= 6) {
      score += 40;
    }

    if (password.length >= 8) {
      score += 20;
    }

    if (password.length >= 12) {
      score += 20;
    }

    // 包含字母或數字即可（不強制要求大小寫、特殊字元）
    if (/[a-zA-Z]/.test(password)) {
      score += 10;
    }

    if (/\d/.test(password)) {
      score += 10;
    }

    // 確保分數在 0-100 範圍內
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * 生成安全的隨機密碼（使用 Node.js crypto 模組，符合密碼學安全要求）
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;

    // 確保至少包含每種類型的字元
    const required = [
      lowercase[randomInt(lowercase.length)],
      uppercase[randomInt(uppercase.length)],
      numbers[randomInt(numbers.length)],
      symbols[randomInt(symbols.length)],
    ];

    // 填充剩餘長度
    const extra: string[] = [];
    for (let i = required.length; i < length; i++) {
      extra.push(allChars[randomInt(allChars.length)]);
    }

    // 使用 crypto 打亂順序（Fisher-Yates shuffle）
    const chars = [...required, ...extra];
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }
}
