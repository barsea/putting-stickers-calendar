export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // 8文字以上チェック
  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }

  // 英字が含まれているかチェック
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('パスワードには英字を含める必要があります');
  }

  // 数字が含まれているかチェック
  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字を含める必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}