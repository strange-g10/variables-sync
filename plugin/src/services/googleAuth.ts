// Simple OAuth2 authentication for Google Sheets
export class GoogleAuthService {
  private clientId = "YOUR_CLIENT_ID"; // Cần được cấu hình
  private redirectUri = "urn:ietf:wg:oauth:2.0:oob"; // For installed apps
  private scope = "https://www.googleapis.com/auth/spreadsheets";

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      response_type: "code",
      access_type: "offline",
      prompt: "consent"
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(authCode: string, clientSecret: string): Promise<string> {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code: authCode,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}
