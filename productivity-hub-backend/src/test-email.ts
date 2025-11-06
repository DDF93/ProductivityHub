import emailService from './services/emailService';

async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Test connection
    const connectionOk = await emailService.testConnection();
    console.log('Connection test:', connectionOk ? 'SUCCESS' : 'FAILED');
    
    // Generate token (test the UUID generation)
    const token = emailService.generateVerificationToken();
    console.log('Generated token:', token);
    
    // Test expiration calculation
    const expiration = emailService.getTokenExpiration();
    console.log('Token expires at:', expiration);
    
    // Send actual test email (replace with your email)
    await emailService.sendVerificationEmail(
      'dwelds@live.co.uk',
      'Test User',
      token
    );
    
    console.log('Test email sent successfully!');
    console.log('Check your email for verification message');
    
  } catch (error) {
    console.error('Email service test failed:', error);
  }
}

testEmailService();