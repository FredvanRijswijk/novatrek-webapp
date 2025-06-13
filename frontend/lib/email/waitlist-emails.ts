import { sendEmail } from './send-email';

interface WaitlistEmailData {
  email: string;
  name?: string;
  position?: number;
}

/**
 * Send welcome email when user joins waitlist
 */
export async function sendWaitlistWelcomeEmail(data: WaitlistEmailData) {
  const { email, name, position } = data;
  
  const subject = 'Welcome to the NovaTrek Waitlist! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .position { background-color: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .position-number { font-size: 36px; font-weight: bold; color: #1976d2; }
          .benefits { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefit { display: flex; align-items: center; margin-bottom: 15px; }
          .benefit-icon { font-size: 24px; margin-right: 15px; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to NovaTrek! ✈️</h1>
          </div>
          
          <div class="content">
            <p>Hi${name ? ` ${name}` : ''},</p>
            
            <p>Thank you for joining the NovaTrek waitlist! We're thrilled to have you as part of our early community of travel enthusiasts.</p>
            
            ${position ? `
            <div class="position">
              <p>Your position in line:</p>
              <div class="position-number">#${position}</div>
            </div>
            ` : ''}
            
            <div class="benefits">
              <h3>What you can expect:</h3>
              <div class="benefit">
                <span class="benefit-icon">🚀</span>
                <div>
                  <strong>Early Access</strong><br>
                  Be among the first to experience AI-powered travel planning
                </div>
              </div>
              <div class="benefit">
                <span class="benefit-icon">💎</span>
                <div>
                  <strong>Founding Member Perks</strong><br>
                  Special pricing and exclusive features forever
                </div>
              </div>
              <div class="benefit">
                <span class="benefit-icon">🎯</span>
                <div>
                  <strong>Shape the Future</strong><br>
                  Your feedback will directly influence our product
                </div>
              </div>
            </div>
            
            <p>We're carefully onboarding users to ensure the best experience for everyone. We'll notify you as soon as your spot is ready!</p>
            
            <p>In the meantime, follow us for updates:</p>
            <ul>
              <li>Check your position anytime at <a href="${process.env.NEXT_PUBLIC_APP_URL}/waitlist/status">${process.env.NEXT_PUBLIC_APP_URL}/waitlist/status</a></li>
              <li>Join our community discussions</li>
              <li>Share NovaTrek with friends who love to travel</li>
            </ul>
            
            <div class="footer">
              <p>Questions? Reply to this email and we'll be happy to help!</p>
              <p>
                NovaTrek - Plan Smarter, Travel Better<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to the NovaTrek Waitlist!

Hi${name ? ` ${name}` : ''},

Thank you for joining the NovaTrek waitlist! We're thrilled to have you as part of our early community of travel enthusiasts.

${position ? `Your position in line: #${position}\n` : ''}

What you can expect:
- Early Access: Be among the first to experience AI-powered travel planning
- Founding Member Perks: Special pricing and exclusive features forever
- Shape the Future: Your feedback will directly influence our product

We're carefully onboarding users to ensure the best experience for everyone. We'll notify you as soon as your spot is ready!

In the meantime:
- Check your position anytime at ${process.env.NEXT_PUBLIC_APP_URL}/waitlist/status
- Join our community discussions
- Share NovaTrek with friends who love to travel

Questions? Reply to this email and we'll be happy to help!

NovaTrek - Plan Smarter, Travel Better
${process.env.NEXT_PUBLIC_APP_URL}
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send invitation email when user is invited
 */
export async function sendWaitlistInvitationEmail(data: WaitlistEmailData) {
  const { email, name } = data;
  
  const subject = '🎉 Your NovaTrek Invitation Has Arrived!';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; padding: 16px 32px; background-color: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .features { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
          .feature { margin-bottom: 20px; }
          .feature-title { font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .special-offer { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to NovaTrek!</h1>
            <p style="font-size: 20px; margin-top: 10px;">Your exclusive access is now active</p>
          </div>
          
          <div class="content">
            <p>Hi${name ? ` ${name}` : ''},</p>
            
            <p><strong>Congratulations!</strong> You've been selected to join NovaTrek as one of our founding members. Your patience has paid off!</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="cta-button">
                Activate Your Account →
              </a>
            </div>
            
            <div class="special-offer">
              <h3 style="margin-top: 0;">🎁 Founding Member Benefits</h3>
              <ul style="margin-bottom: 0;">
                <li><strong>Lifetime 30% discount</strong> on all premium features</li>
                <li><strong>Unlimited AI trip planning</strong> (normally 5/month)</li>
                <li><strong>Early access</strong> to new features</li>
                <li><strong>Priority support</strong> from our team</li>
                <li><strong>Founding member badge</strong> on your profile</li>
              </ul>
            </div>
            
            <div class="features">
              <h3>What you can do with NovaTrek:</h3>
              
              <div class="feature">
                <div class="feature-title">✨ AI-Powered Trip Planning</div>
                <div>Get personalized itineraries based on your preferences, budget, and travel style</div>
              </div>
              
              <div class="feature">
                <div class="feature-title">📍 Smart Activity Discovery</div>
                <div>Find hidden gems and must-see attractions with our Google Places integration</div>
              </div>
              
              <div class="feature">
                <div class="feature-title">💰 Budget Tracking</div>
                <div>Keep your trip on budget with real-time expense tracking and insights</div>
              </div>
              
              <div class="feature">
                <div class="feature-title">🎒 Packing Lists</div>
                <div>Never forget essentials with smart, destination-aware packing lists</div>
              </div>
              
              <div class="feature">
                <div class="feature-title">🤝 Trip Sharing</div>
                <div>Collaborate with travel companions and share your adventures</div>
              </div>
            </div>
            
            <h3>Getting Started:</h3>
            <ol>
              <li>Click the button above to sign in with your email: <strong>${email}</strong></li>
              <li>Complete your travel profile (takes 2 minutes)</li>
              <li>Create your first trip and let our AI assist you</li>
              <li>Explore and enjoy planning your perfect adventure!</li>
            </ol>
            
            <p><strong>Important:</strong> Your founding member benefits are automatically applied to your account. No promo code needed!</p>
            
            <div class="footer">
              <p>Need help getting started? We're here for you!</p>
              <p>Reply to this email or visit our help center.</p>
              <p>
                Welcome to the NovaTrek family! 🌍<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Your NovaTrek Invitation Has Arrived!

Hi${name ? ` ${name}` : ''},

Congratulations! You've been selected to join NovaTrek as one of our founding members. Your patience has paid off!

Activate Your Account: ${process.env.NEXT_PUBLIC_APP_URL}/login

FOUNDING MEMBER BENEFITS:
- Lifetime 30% discount on all premium features
- Unlimited AI trip planning (normally 5/month)
- Early access to new features
- Priority support from our team
- Founding member badge on your profile

What you can do with NovaTrek:
- AI-Powered Trip Planning: Get personalized itineraries
- Smart Activity Discovery: Find hidden gems and attractions
- Budget Tracking: Keep your trip on budget
- Packing Lists: Never forget essentials
- Trip Sharing: Collaborate with travel companions

Getting Started:
1. Sign in with your email: ${email}
2. Complete your travel profile (takes 2 minutes)
3. Create your first trip and let our AI assist you
4. Explore and enjoy planning your perfect adventure!

Your founding member benefits are automatically applied - no promo code needed!

Need help? Reply to this email or visit our help center.

Welcome to the NovaTrek family!
${process.env.NEXT_PUBLIC_APP_URL}
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}