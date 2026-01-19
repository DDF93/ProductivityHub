// Password validation utility
// Keeps frontend and backend validation logic synchronized

export interface PasswordValidationResult {
  isValid: boolean; 
  errors: string[];
}

/**
 * Validates password meets security requirements
 * 
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (@$!%*?&#)
 */
export function validatePassword(password: string): PasswordValidationResult {
  // Array to collect error messages
  const errors: string[] = [];
  
  // Check 1: Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check 2: Contains uppercase letter
  // /[A-Z]/ = Regular expression that matches any uppercase letter
  // .test() = Returns true if pattern is found, false otherwise
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check 3: Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check 4: Contains number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check 5: Contains special character
  // Only allow specific special characters for security
  if (!/[@$!%*?&#]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&#)');
  }
  
  // Return result
  return {
    // isValid is true only if errors array is empty
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get a user-friendly message explaining password requirements
 */
export function getPasswordRequirementsMessage(): string {
  return 'Password must be at least 8 characters and include:\n' +
         '• One uppercase letter (A-Z)\n' +
         '• One lowercase letter (a-z)\n' +
         '• One number (0-9)\n' +
         '• One special character (@$!%*?&#)';
}

/**
 * Example usage:
 * 
 * const result = validatePassword('weak');
 * console.log(result.isValid);  // false
 * console.log(result.errors);   // ['Password must be at least 8...', ...]
 * 
 * const result2 = validatePassword('Str0ng!Pass');
 * console.log(result2.isValid);  // true
 * console.log(result2.errors);   // []
 */