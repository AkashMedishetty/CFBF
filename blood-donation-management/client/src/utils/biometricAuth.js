import logger from './logger';

class BiometricAuth {
  constructor() {
    this.isSupported = null;
    this.availableAuthenticators = [];
    
    logger.debug('BiometricAuth initialized', 'BIOMETRIC_AUTH');
  }

  // Check if biometric authentication is supported
  async isSupported() {
    if (this.isSupported !== null) {
      return this.isSupported;
    }

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        logger.debug('WebAuthn not supported', 'BIOMETRIC_AUTH');
        this.isSupported = false;
        return false;
      }

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      logger.debug('Platform authenticator availability checked', 'BIOMETRIC_AUTH', {
        available,
        hasWebAuthn: !!window.PublicKeyCredential
      });

      this.isSupported = available;
      return available;
    } catch (error) {
      logger.warn('Error checking biometric support', 'BIOMETRIC_AUTH', error);
      this.isSupported = false;
      return false;
    }
  }

  // Register biometric authentication for a user
  async register(userId, userName = 'User') {
    try {
      if (!(await this.isSupported())) {
        throw new Error('Biometric authentication is not supported on this device');
      }

      logger.info('Starting biometric registration', 'BIOMETRIC_AUTH', { userId });

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create credential options
      const createCredentialOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "CallforBlood Foundation",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7, // ES256
            },
            {
              type: "public-key", 
              alg: -257, // RS256
            }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: "direct"
        }
      };

      // Create credential
      const credential = await navigator.credentials.create(createCredentialOptions);

      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }

      // Store credential info
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
        userId: userId,
        createdAt: Date.now()
      };

      // Store in localStorage (in production, this should be stored securely on server)
      localStorage.setItem(`biometric_${userId}`, JSON.stringify(credentialData));

      logger.success('Biometric registration successful', 'BIOMETRIC_AUTH', {
        userId,
        credentialId: credential.id
      });

      return {
        success: true,
        credentialId: credential.id
      };

    } catch (error) {
      logger.error('Biometric registration failed', 'BIOMETRIC_AUTH', error);
      
      let userMessage = 'Failed to register biometric authentication';
      if (error.name === 'NotAllowedError') {
        userMessage = 'Biometric authentication was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        userMessage = 'Biometric authentication is not supported on this device';
      }

      return {
        success: false,
        error: userMessage
      };
    }
  }

  // Authenticate using biometrics
  async authenticate(userId, challenge = null) {
    try {
      if (!(await this.isSupported())) {
        throw new Error('Biometric authentication is not supported on this device');
      }

      logger.info('Starting biometric authentication', 'BIOMETRIC_AUTH', { userId });

      // Get stored credential
      const storedCredential = localStorage.getItem(`biometric_${userId}`);
      if (!storedCredential) {
        throw new Error('No biometric credential found for this user');
      }

      const credentialData = JSON.parse(storedCredential);

      // Generate challenge if not provided
      if (!challenge) {
        challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
      }

      // Create authentication options
      const getCredentialOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: new Uint8Array(credentialData.rawId),
            type: "public-key",
            transports: ["internal"]
          }],
          userVerification: "required",
          timeout: 60000
        }
      };

      // Get credential
      const assertion = await navigator.credentials.get(getCredentialOptions);

      if (!assertion) {
        throw new Error('Biometric authentication failed');
      }

      logger.success('Biometric authentication successful', 'BIOMETRIC_AUTH', {
        userId,
        credentialId: assertion.id
      });

      return {
        success: true,
        credentialId: assertion.id,
        signature: Array.from(new Uint8Array(assertion.response.signature)),
        authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData))
      };

    } catch (error) {
      logger.error('Biometric authentication failed', 'BIOMETRIC_AUTH', error);
      
      let userMessage = 'Biometric authentication failed';
      if (error.name === 'NotAllowedError') {
        userMessage = 'Biometric authentication was cancelled or failed';
      } else if (error.name === 'InvalidStateError') {
        userMessage = 'Biometric authentication is not set up for this account';
      }

      return {
        success: false,
        error: userMessage
      };
    }
  }

  // Check if user has biometric authentication set up
  hasBiometricCredential(userId) {
    const stored = localStorage.getItem(`biometric_${userId}`);
    return !!stored;
  }

  // Remove biometric credential
  async removeBiometricCredential(userId) {
    try {
      localStorage.removeItem(`biometric_${userId}`);
      logger.success('Biometric credential removed', 'BIOMETRIC_AUTH', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to remove biometric credential', 'BIOMETRIC_AUTH', error);
      return { success: false, error: error.message };
    }
  }

  // Get available authenticator types
  async getAvailableAuthenticators() {
    try {
      const authenticators = [];

      if (await this.isSupported()) {
        authenticators.push({
          type: 'platform',
          name: 'Device Biometrics',
          description: 'Use your device\'s built-in biometric authentication (fingerprint, face, etc.)'
        });
      }

      // Check for other authenticator types if needed
      // This could be extended to support external authenticators

      this.availableAuthenticators = authenticators;
      return authenticators;
    } catch (error) {
      logger.error('Failed to get available authenticators', 'BIOMETRIC_AUTH', error);
      return [];
    }
  }

  // Prompt user to set up biometric authentication
  async promptSetup(userId, userName) {
    try {
      const authenticators = await this.getAvailableAuthenticators();
      
      if (authenticators.length === 0) {
        return {
          success: false,
          error: 'No biometric authenticators available on this device'
        };
      }

      // In a real implementation, you might show a modal here
      const userConfirmed = confirm(
        'Would you like to set up biometric authentication for faster and more secure access to sensitive features?'
      );

      if (!userConfirmed) {
        return {
          success: false,
          error: 'User declined biometric setup'
        };
      }

      return await this.register(userId, userName);
    } catch (error) {
      logger.error('Biometric setup prompt failed', 'BIOMETRIC_AUTH', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const biometricAuth = new BiometricAuth();

export default biometricAuth;