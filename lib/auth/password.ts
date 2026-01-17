import bcrypt from 'bcryptjs';

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

    // 基本長度檢查
    if (password.length < 8) {
      errors.push('密碼至少需要 8 個字元');
    } else if (password.length >= 8) {
      score += 20;
    }

    if (password.length >= 12) {
      score += 10;
    }

    // 包含小寫字母
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      errors.push('密碼需要包含小寫字母');
    }

    // 包含大寫字母
    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      errors.push('密碼需要包含大寫字母');
    }

    // 包含數字
    if (/\d/.test(password)) {
      score += 15;
    } else {
      errors.push('密碼需要包含數字');
    }

    // 包含特殊字元
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    } else {
      errors.push('密碼需要包含特殊字元 (!@#$%^&* 等)');
    }

    // 不包含常見弱密碼
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', '111111', '123123', 'admin', 'root'
    ];
    
    if (commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )) {
      errors.push('密碼不能包含常見的弱密碼');
      score -= 20;
    } else {
      score += 10;
    }

    // 確保分數在 0-100 範圍內
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0 && score >= 60,
      errors,
      score
    };
  }

  /**
   * 生成安全的隨機密碼
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // 確保至少包含每種類型的字元
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // 填充剩餘長度
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // 打亂密碼字元順序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}