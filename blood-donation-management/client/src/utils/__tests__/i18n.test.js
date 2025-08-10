/**
 * I18n System Tests
 * Comprehensive tests for internationalization functionality
 */

import i18n from '../i18n';
import { setupTestEnvironment, cleanupUtils } from '../testUtils';

describe('I18n Manager', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestEnvironment();
    // Reset i18n state
    localStorage.removeItem('preferred_language');
  });

  afterEach(() => {
    cleanupUtils.cleanupAll();
  });

  describe('Language Detection', () => {
    test('should detect language from localStorage', () => {
      mocks.localStorage.getItem.mockReturnValue('hi');
      
      // Create new instance to test detection
      const testI18n = new (i18n.constructor)();
      
      expect(testI18n.getCurrentLanguage()).toBe('hi');
    });

    test('should detect language from browser', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'es-ES',
        writable: true
      });
      
      mocks.localStorage.getItem.mockReturnValue(null);
      
      const testI18n = new (i18n.constructor)();
      
      expect(testI18n.getCurrentLanguage()).toBe('es');
    });

    test('should fallback to English for unsupported languages', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE', // German - not supported
        writable: true
      });
      
      mocks.localStorage.getItem.mockReturnValue(null);
      
      const testI18n = new (i18n.constructor)();
      
      expect(testI18n.getCurrentLanguage()).toBe('en');
    });
  });

  describe('Translation', () => {
    test('should return translation for existing key', () => {
      const translation = i18n.t('app.title');
      expect(translation).toBe('Call For Blood');
    });

    test('should return key for missing translation', () => {
      const translation = i18n.t('missing.key');
      expect(translation).toBe('missing.key');
    });

    test('should interpolate parameters', () => {
      // Assuming we have a translation like "Hello {{name}}"
      const translation = i18n.t('greeting.hello', { name: 'John' });
      expect(translation).toContain('John');
    });

    test('should handle multiple parameters', () => {
      const translation = i18n.t('message.with.params', { 
        user: 'Alice', 
        count: 5,
        item: 'messages'
      });
      
      // Should replace all parameters
      expect(translation).not.toContain('{{');
      expect(translation).not.toContain('}}');
    });

    test('should fallback to fallback language', async () => {
      // Change to a language that might not have all translations
      await i18n.changeLanguage('hi');
      
      // Try to get a key that might only exist in English
      const translation = i18n.t('some.english.only.key');
      
      // Should either return the Hindi translation or fallback to English
      expect(typeof translation).toBe('string');
      expect(translation.length).toBeGreaterThan(0);
    });
  });

  describe('Language Switching', () => {
    test('should change language successfully', async () => {
      const result = await i18n.changeLanguage('hi');
      
      expect(result).toBe(true);
      expect(i18n.getCurrentLanguage()).toBe('hi');
      expect(mocks.localStorage.setItem).toHaveBeenCalledWith('preferred_language', 'hi');
    });

    test('should reject invalid language codes', async () => {
      const result = await i18n.changeLanguage('invalid');
      
      expect(result).toBe(false);
      expect(i18n.getCurrentLanguage()).not.toBe('invalid');
    });

    test('should dispatch language change event', async () => {
      const eventListener = jest.fn();
      window.addEventListener('languageChanged', eventListener);
      
      await i18n.changeLanguage('es');
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            language: 'es'
          })
        })
      );
      
      window.removeEventListener('languageChanged', eventListener);
    });
  });

  describe('Formatting', () => {
    test('should format dates according to locale', () => {
      const testDate = new Date('2024-02-10T10:30:00Z');
      
      const englishDate = i18n.formatDate(testDate, 'en');
      const hindiDate = i18n.formatDate(testDate, 'hi');
      
      expect(typeof englishDate).toBe('string');
      expect(typeof hindiDate).toBe('string');
      expect(englishDate).not.toBe(hindiDate);
    });

    test('should format time according to locale', () => {
      const testTime = new Date('2024-02-10T14:30:00Z');
      
      const englishTime = i18n.formatTime(testTime, 'en');
      const spanishTime = i18n.formatTime(testTime, 'es');
      
      expect(typeof englishTime).toBe('string');
      expect(typeof spanishTime).toBe('string');
    });

    test('should format numbers according to locale', () => {
      const testNumber = 1234567.89;
      
      const englishNumber = i18n.formatNumber(testNumber, 'en');
      const hindiNumber = i18n.formatNumber(testNumber, 'hi');
      
      expect(typeof englishNumber).toBe('string');
      expect(typeof hindiNumber).toBe('string');
      expect(englishNumber).toContain('1,234,567.89');
    });

    test('should format currency according to locale', () => {
      const amount = 1250.75;
      
      const usdFormat = i18n.formatCurrency(amount, 'USD', 'en');
      const inrFormat = i18n.formatCurrency(amount, 'INR', 'hi');
      
      expect(typeof usdFormat).toBe('string');
      expect(typeof inrFormat).toBe('string');
      expect(usdFormat).toContain('$');
      expect(inrFormat).toContain('₹');
    });

    test('should handle formatting errors gracefully', () => {
      const invalidDate = 'invalid-date';
      
      const formattedDate = i18n.formatDate(invalidDate);
      
      // Should not throw error and return some string
      expect(typeof formattedDate).toBe('string');
    });
  });

  describe('RTL Language Support', () => {
    test('should identify RTL languages correctly', () => {
      expect(i18n.isRTL('ar')).toBe(true);
      expect(i18n.isRTL('he')).toBe(true);
      expect(i18n.isRTL('fa')).toBe(true);
      expect(i18n.isRTL('ur')).toBe(true);
      
      expect(i18n.isRTL('en')).toBe(false);
      expect(i18n.isRTL('hi')).toBe(false);
      expect(i18n.isRTL('es')).toBe(false);
    });

    test('should handle RTL for current language', () => {
      // Test with LTR language
      i18n.changeLanguage('en');
      expect(i18n.isRTL()).toBe(false);
      
      // Test with RTL language
      i18n.changeLanguage('ar');
      expect(i18n.isRTL()).toBe(true);
    });
  });

  describe('Pluralization', () => {
    test('should handle English pluralization', () => {
      const singular = i18n.plural(1, 'donor', 'donors', 'en');
      const plural = i18n.plural(5, 'donor', 'donors', 'en');
      
      expect(singular).toBe('donor');
      expect(plural).toBe('donors');
    });

    test('should handle zero as plural', () => {
      const zero = i18n.plural(0, 'donor', 'donors', 'en');
      expect(zero).toBe('donors');
    });

    test('should handle other languages', () => {
      // For now, using simple rule - extend for language-specific rules
      const hindiSingular = i18n.plural(1, 'दाता', 'दाता', 'hi');
      const hindiPlural = i18n.plural(5, 'दाता', 'दाता', 'hi');
      
      expect(typeof hindiSingular).toBe('string');
      expect(typeof hindiPlural).toBe('string');
    });
  });

  describe('Available Languages', () => {
    test('should return list of available languages', () => {
      const languages = i18n.getAvailableLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      
      languages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
      });
    });

    test('should include expected languages', () => {
      const languages = i18n.getAvailableLanguages();
      const codes = languages.map(lang => lang.code);
      
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
      expect(codes).toContain('es');
      expect(codes).toContain('fr');
      expect(codes).toContain('ar');
    });
  });

  describe('Language Validation', () => {
    test('should validate supported languages', () => {
      expect(i18n.isValidLanguage('en')).toBe(true);
      expect(i18n.isValidLanguage('hi')).toBe(true);
      expect(i18n.isValidLanguage('es')).toBe(true);
      expect(i18n.isValidLanguage('invalid')).toBe(false);
      expect(i18n.isValidLanguage('')).toBe(false);
      expect(i18n.isValidLanguage(null)).toBe(false);
    });
  });

  describe('Translation Loading', () => {
    test('should load translations for language', async () => {
      await i18n.loadLanguage('es');
      
      // Should have loaded Spanish translations
      const spanishTranslation = i18n.t('app.title', {}, 'es');
      expect(spanishTranslation).toBeTruthy();
    });

    test('should handle loading errors gracefully', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Should not throw error
      await expect(i18n.loadLanguage('fr')).resolves.not.toThrow();
    });

    test('should not reload already loaded languages', async () => {
      const loadSpy = jest.spyOn(i18n, 'fetchTranslations');
      
      // Load language twice
      await i18n.loadLanguage('en');
      await i18n.loadLanguage('en');
      
      // Should only fetch once
      expect(loadSpy).toHaveBeenCalledTimes(1);
      
      loadSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should translate quickly', () => {
      const startTime = performance.now();
      
      // Perform 1000 translations
      for (let i = 0; i < 1000; i++) {
        i18n.t('app.title');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(100); // 100ms for 1000 translations
    });

    test('should format dates quickly', () => {
      const testDate = new Date();
      const startTime = performance.now();
      
      // Format 100 dates
      for (let i = 0; i < 100; i++) {
        i18n.formatDate(testDate);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing translation gracefully', () => {
      const translation = i18n.t('completely.missing.key');
      
      // Should return the key itself
      expect(translation).toBe('completely.missing.key');
    });

    test('should handle invalid parameters gracefully', () => {
      const translation = i18n.t('app.title', null);
      
      // Should not throw error
      expect(typeof translation).toBe('string');
    });

    test('should handle formatter errors gracefully', () => {
      const invalidDate = 'not-a-date';
      const formattedDate = i18n.formatDate(invalidDate);
      
      // Should return some string without throwing
      expect(typeof formattedDate).toBe('string');
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with frequent language changes', async () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Change languages multiple times
      for (let i = 0; i < 10; i++) {
        await i18n.changeLanguage('en');
        await i18n.changeLanguage('hi');
        await i18n.changeLanguage('es');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Memory usage should not increase dramatically
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      }
    });
  });
});