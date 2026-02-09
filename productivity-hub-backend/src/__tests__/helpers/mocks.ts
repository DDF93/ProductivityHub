import emailService from '../../services/emailService';

/**
 * Mock email service to prevent sending real emails in tests
 * Returns spy functions so we can verify emails were "sent"
 */
export function mockEmailService() {
  // Mock sendVerificationEmail method on the emailService instance
  const sendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail')
    .mockResolvedValue(undefined);
  
  return {
    sendVerificationEmail,
  };
}

/**
 * Restore all mocks to original implementations
 */
export function restoreMocks() {
  jest.restoreAllMocks();
}