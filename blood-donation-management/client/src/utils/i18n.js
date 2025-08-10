/**
 * Internationalization (i18n) System
 * Comprehensive multi-language support with automatic detection and formatting
 */

class I18nManager {
  constructor() {
    this.currentLanguage = 'en';
    this.fallbackLanguage = 'en';
    this.translations = new Map();
    this.formatters = new Map();
    this.listeners = new Set();
    this.loadedLanguages = new Set();
    
    // Supported languages with their configurations
    this.supportedLanguages = {
      en: {
        name: 'English',
        nativeName: 'English',
        code: 'en',
        locale: 'en-US',
        rtl: false,
        flag: '🇺🇸'
      },
      es: {
        name: 'Spanish',
        nativeName: 'Español',
        code: 'es',
        locale: 'es-ES',
        rtl: false,
        flag: '🇪🇸'
      },
      fr: {
        name: 'French',
        nativeName: 'Français',
        code: 'fr',
        locale: 'fr-FR',
        rtl: false,
        flag: '🇫🇷'
      },
      de: {
        name: 'German',
        nativeName: 'Deutsch',
        code: 'de',
        locale: 'de-DE',
        rtl: false,
        flag: '🇩🇪'
      },
      hi: {
        name: 'Hindi',
        nativeName: 'हिन्दी',
        code: 'hi',
        locale: 'hi-IN',
        rtl: false,
        flag: '🇮🇳'
      },
      ar: {
        name: 'Arabic',
        nativeName: 'العربية',
        code: 'ar',
        locale: 'ar-SA',
        rtl: true,
        flag: '🇸🇦'
      },
      zh: {
        name: 'Chinese',
        nativeName: '中文',
        code: 'zh',
        locale: 'zh-CN',
        rtl: false,
        flag: '🇨🇳'
      },
      pt: {
        name: 'Portuguese',
        nativeName: 'Português',
        code: 'pt',
        locale: 'pt-BR',
        rtl: false,
        flag: '🇧🇷'
      },
      ru: {
        name: 'Russian',
        nativeName: 'Русский',
        code: 'ru',
        locale: 'ru-RU',
        rtl: false,
        flag: '🇷🇺'
      },
      ja: {
        name: 'Japanese',
        nativeName: '日本語',
        code: 'ja',
        locale: 'ja-JP',
        rtl: false,
        flag: '🇯🇵'
      }
    };
    
    this.initialize();
  }

  // Initialize i18n system
  async initialize() {
    // Detect user's preferred language
    const detectedLanguage = this.detectLanguage();
    
    // Load default language (English)
    await this.loadLanguage('en');
    
    // Load detected language if different from English
    if (detectedLanguage !== 'en') {
      await this.loadLanguage(detectedLanguage);
      this.setLanguage(detectedLanguage);
    }
    
    // Set up formatters
    this.setupFormatters();
    
    // Apply RTL if needed
    this.applyDirectionality();
    
    console.log(`[i18n] Initialized with language: ${this.currentLanguage}`);
  }

  // Detect user's preferred language
  detectLanguage() {
    // Check localStorage first
    const storedLanguage = localStorage.getItem('preferred-language');
    if (storedLanguage && this.supportedLanguages[storedLanguage]) {
      return storedLanguage;
    }
    
    // Check browser languages
    const browserLanguages = navigator.languages || [navigator.language];
    
    for (const browserLang of browserLanguages) {
      // Extract language code (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split('-')[0].toLowerCase();
      
      if (this.supportedLanguages[langCode]) {
        return langCode;
      }
    }
    
    // Fallback to English
    return 'en';
  }

  // Load language translations
  async loadLanguage(languageCode) {
    if (this.loadedLanguages.has(languageCode)) {
      return;
    }

    try {
      // In a real application, this would load from a server or import files
      // For now, we'll use embedded translations
      const translations = await this.getTranslations(languageCode);
      this.translations.set(languageCode, translations);
      this.loadedLanguages.add(languageCode);
      
      console.log(`[i18n] Loaded translations for: ${languageCode}`);
    } catch (error) {
      console.error(`[i18n] Failed to load language ${languageCode}:`, error);
    }
  }

  // Get translations for a language (embedded for demo)
  async getTranslations(languageCode) {
    const translations = {
      en: {
        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.submit': 'Submit',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.yes': 'Yes',
        'common.no': 'No',
        
        // Navigation
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.emergency': 'Emergency',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.dashboard': 'Dashboard',
        'nav.profile': 'Profile',
        'nav.logout': 'Logout',
        
        // Emergency
        'emergency.title': 'Emergency Blood Request',
        'emergency.urgent': 'Urgent',
        'emergency.critical': 'Critical',
        'emergency.bloodType': 'Blood Type',
        'emergency.location': 'Location',
        'emergency.hospital': 'Hospital',
        'emergency.contact': 'Contact',
        'emergency.submit': 'Submit Request',
        'emergency.success': 'Emergency request submitted successfully',
        
        // Authentication
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirmPassword': 'Confirm Password',
        'auth.phone': 'Phone Number',
        'auth.forgotPassword': 'Forgot Password?',
        'auth.resetPassword': 'Reset Password',
        'auth.loginSuccess': 'Login successful',
        'auth.registerSuccess': 'Registration successful',
        
        // Donor
        'donor.dashboard': 'Donor Dashboard',
        'donor.profile': 'Donor Profile',
        'donor.history': 'Donation History',
        'donor.availability': 'Availability',
        'donor.certificates': 'Certificates',
        'donor.bloodType': 'Blood Type',
        'donor.lastDonation': 'Last Donation',
        'donor.totalDonations': 'Total Donations',
        
        // Notifications
        'notification.newRequest': 'New blood request in your area',
        'notification.requestAccepted': 'Your blood request has been accepted',
        'notification.donationReminder': 'Time for your next donation',
        'notification.emergencyAlert': 'Emergency blood request - immediate help needed',
        
        // Time and Date
        'time.now': 'now',
        'time.minutesAgo': '{count} minutes ago',
        'time.hoursAgo': '{count} hours ago',
        'time.daysAgo': '{count} days ago',
        'time.today': 'Today',
        'time.yesterday': 'Yesterday',
        'time.tomorrow': 'Tomorrow',
        
        // Blood Types
        'bloodType.aPositive': 'A+',
        'bloodType.aNegative': 'A-',
        'bloodType.bPositive': 'B+',
        'bloodType.bNegative': 'B-',
        'bloodType.abPositive': 'AB+',
        'bloodType.abNegative': 'AB-',
        'bloodType.oPositive': 'O+',
        'bloodType.oNegative': 'O-',
        
        // Accessibility
        'a11y.skipToMain': 'Skip to main content',
        'a11y.skipToNav': 'Skip to navigation',
        'a11y.openMenu': 'Open menu',
        'a11y.closeMenu': 'Close menu',
        'a11y.loading': 'Loading content',
        'a11y.error': 'Error occurred',
        'a11y.required': 'Required field',
        'a11y.optional': 'Optional field'
      },
      
      es: {
        // Common
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.success': 'Éxito',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'common.close': 'Cerrar',
        'common.back': 'Atrás',
        'common.next': 'Siguiente',
        'common.previous': 'Anterior',
        'common.submit': 'Enviar',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.sort': 'Ordenar',
        'common.yes': 'Sí',
        'common.no': 'No',
        
        // Navigation
        'nav.home': 'Inicio',
        'nav.about': 'Acerca de',
        'nav.contact': 'Contacto',
        'nav.emergency': 'Emergencia',
        'nav.login': 'Iniciar Sesión',
        'nav.register': 'Registrarse',
        'nav.dashboard': 'Panel',
        'nav.profile': 'Perfil',
        'nav.logout': 'Cerrar Sesión',
        
        // Emergency
        'emergency.title': 'Solicitud de Sangre de Emergencia',
        'emergency.urgent': 'Urgente',
        'emergency.critical': 'Crítico',
        'emergency.bloodType': 'Tipo de Sangre',
        'emergency.location': 'Ubicación',
        'emergency.hospital': 'Hospital',
        'emergency.contact': 'Contacto',
        'emergency.submit': 'Enviar Solicitud',
        'emergency.success': 'Solicitud de emergencia enviada exitosamente',
        
        // Authentication
        'auth.login': 'Iniciar Sesión',
        'auth.register': 'Registrarse',
        'auth.email': 'Correo Electrónico',
        'auth.password': 'Contraseña',
        'auth.confirmPassword': 'Confirmar Contraseña',
        'auth.phone': 'Número de Teléfono',
        'auth.forgotPassword': '¿Olvidaste tu contraseña?',
        'auth.resetPassword': 'Restablecer Contraseña',
        'auth.loginSuccess': 'Inicio de sesión exitoso',
        'auth.registerSuccess': 'Registro exitoso',
        
        // Donor
        'donor.dashboard': 'Panel del Donante',
        'donor.profile': 'Perfil del Donante',
        'donor.history': 'Historial de Donaciones',
        'donor.availability': 'Disponibilidad',
        'donor.certificates': 'Certificados',
        'donor.bloodType': 'Tipo de Sangre',
        'donor.lastDonation': 'Última Donación',
        'donor.totalDonations': 'Total de Donaciones',
        
        // Notifications
        'notification.newRequest': 'Nueva solicitud de sangre en tu área',
        'notification.requestAccepted': 'Tu solicitud de sangre ha sido aceptada',
        'notification.donationReminder': 'Es hora de tu próxima donación',
        'notification.emergencyAlert': 'Solicitud de sangre de emergencia - se necesita ayuda inmediata',
        
        // Time and Date
        'time.now': 'ahora',
        'time.minutesAgo': 'hace {count} minutos',
        'time.hoursAgo': 'hace {count} horas',
        'time.daysAgo': 'hace {count} días',
        'time.today': 'Hoy',
        'time.yesterday': 'Ayer',
        'time.tomorrow': 'Mañana',
        
        // Blood Types
        'bloodType.aPositive': 'A+',
        'bloodType.aNegative': 'A-',
        'bloodType.bPositive': 'B+',
        'bloodType.bNegative': 'B-',
        'bloodType.abPositive': 'AB+',
        'bloodType.abNegative': 'AB-',
        'bloodType.oPositive': 'O+',
        'bloodType.oNegative': 'O-',
        
        // Accessibility
        'a11y.skipToMain': 'Saltar al contenido principal',
        'a11y.skipToNav': 'Saltar a la navegación',
        'a11y.openMenu': 'Abrir menú',
        'a11y.closeMenu': 'Cerrar menú',
        'a11y.loading': 'Cargando contenido',
        'a11y.error': 'Ocurrió un error',
        'a11y.required': 'Campo obligatorio',
        'a11y.optional': 'Campo opcional'
      },
      
      hi: {
        // Common
        'common.loading': 'लोड हो रहा है...',
        'common.error': 'त्रुटि',
        'common.success': 'सफलता',
        'common.cancel': 'रद्द करें',
        'common.save': 'सहेजें',
        'common.delete': 'हटाएं',
        'common.edit': 'संपादित करें',
        'common.close': 'बंद करें',
        'common.back': 'वापस',
        'common.next': 'अगला',
        'common.previous': 'पिछला',
        'common.submit': 'जमा करें',
        'common.search': 'खोजें',
        'common.filter': 'फ़िल्टर',
        'common.sort': 'क्रमबद्ध करें',
        'common.yes': 'हाँ',
        'common.no': 'नहीं',
        
        // Navigation
        'nav.home': 'होम',
        'nav.about': 'हमारे बारे में',
        'nav.contact': 'संपर्क',
        'nav.emergency': 'आपातकाल',
        'nav.login': 'लॉगिन',
        'nav.register': 'पंजीकरण',
        'nav.dashboard': 'डैशबोर्ड',
        'nav.profile': 'प्रोफ़ाइल',
        'nav.logout': 'लॉगआउट',
        
        // Emergency
        'emergency.title': 'आपातकालीन रक्त अनुरोध',
        'emergency.urgent': 'तत्काल',
        'emergency.critical': 'गंभीर',
        'emergency.bloodType': 'रक्त समूह',
        'emergency.location': 'स्थान',
        'emergency.hospital': 'अस्पताल',
        'emergency.contact': 'संपर्क',
        'emergency.submit': 'अनुरोध भेजें',
        'emergency.success': 'आपातकालीन अनुरोध सफलतापूर्वक भेजा गया',
        
        // Authentication
        'auth.login': 'लॉगिन',
        'auth.register': 'पंजीकरण',
        'auth.email': 'ईमेल',
        'auth.password': 'पासवर्ड',
        'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
        'auth.phone': 'फोन नंबर',
        'auth.forgotPassword': 'पासवर्ड भूल गए?',
        'auth.resetPassword': 'पासवर्ड रीसेट करें',
        'auth.loginSuccess': 'लॉगिन सफल',
        'auth.registerSuccess': 'पंजीकरण सफल',
        
        // Donor
        'donor.dashboard': 'दाता डैशबोर्ड',
        'donor.profile': 'दाता प्रोफ़ाइल',
        'donor.history': 'दान इतिहास',
        'donor.availability': 'उपलब्धता',
        'donor.certificates': 'प्रमाणपत्र',
        'donor.bloodType': 'रक्त समूह',
        'donor.lastDonation': 'अंतिम दान',
        'donor.totalDonations': 'कुल दान',
        
        // Notifications
        'notification.newRequest': 'आपके क्षेत्र में नया रक्त अनुरोध',
        'notification.requestAccepted': 'आपका रक्त अनुरोध स्वीकार कर लिया गया है',
        'notification.donationReminder': 'आपके अगले दान का समय',
        'notification.emergencyAlert': 'आपातकालीन रक्त अनुरोध - तत्काल सहायता की आवश्यकता',
        
        // Time and Date
        'time.now': 'अभी',
        'time.minutesAgo': '{count} मिनट पहले',
        'time.hoursAgo': '{count} घंटे पहले',
        'time.daysAgo': '{count} दिन पहले',
        'time.today': 'आज',
        'time.yesterday': 'कल',
        'time.tomorrow': 'कल',
        
        // Blood Types
        'bloodType.aPositive': 'A+',
        'bloodType.aNegative': 'A-',
        'bloodType.bPositive': 'B+',
        'bloodType.bNegative': 'B-',
        'bloodType.abPositive': 'AB+',
        'bloodType.abNegative': 'AB-',
        'bloodType.oPositive': 'O+',
        'bloodType.oNegative': 'O-',
        
        // Accessibility
        'a11y.skipToMain': 'मुख्य सामग्री पर जाएं',
        'a11y.skipToNav': 'नेवीगेशन पर जाएं',
        'a11y.openMenu': 'मेनू खोलें',
        'a11y.closeMenu': 'मेनू बंद करें',
        'a11y.loading': 'सामग्री लोड हो रही है',
        'a11y.error': 'त्रुटि हुई',
        'a11y.required': 'आवश्यक फ़ील्ड',
        'a11y.optional': 'वैकल्पिक फ़ील्ड'
      }
    };
    
    return translations[languageCode] || translations.en;
  }

  // Set current language
  async setLanguage(languageCode) {
    if (!this.supportedLanguages[languageCode]) {
      console.warn(`[i18n] Unsupported language: ${languageCode}`);
      return;
    }
    
    // Load language if not already loaded
    if (!this.loadedLanguages.has(languageCode)) {
      await this.loadLanguage(languageCode);
    }
    
    const previousLanguage = this.currentLanguage;
    this.currentLanguage = languageCode;
    
    // Store preference
    localStorage.setItem('preferred-language', languageCode);
    
    // Update document language
    document.documentElement.lang = languageCode;
    
    // Apply directionality
    this.applyDirectionality();
    
    // Update formatters
    this.setupFormatters();
    
    // Notify listeners
    this.notifyLanguageChange(languageCode, previousLanguage);
    
    console.log(`[i18n] Language changed to: ${languageCode}`);
  }

  // Apply text directionality (RTL/LTR)
  applyDirectionality() {
    const language = this.supportedLanguages[this.currentLanguage];
    const direction = language.rtl ? 'rtl' : 'ltr';
    
    document.documentElement.dir = direction;
    document.body.classList.toggle('rtl', language.rtl);
    document.body.classList.toggle('ltr', !language.rtl);
  }

  // Setup number and date formatters
  setupFormatters() {
    const language = this.supportedLanguages[this.currentLanguage];
    const locale = language.locale;
    
    // Number formatter
    this.formatters.set('number', new Intl.NumberFormat(locale));
    
    // Currency formatter (assuming USD for now)
    this.formatters.set('currency', new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    }));
    
    // Date formatters
    this.formatters.set('date', new Intl.DateTimeFormat(locale));
    this.formatters.set('dateTime', new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));
    this.formatters.set('time', new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }));
    
    // Relative time formatter
    if ('RelativeTimeFormat' in Intl) {
      this.formatters.set('relativeTime', new Intl.RelativeTimeFormat(locale, {
        numeric: 'auto'
      }));
    }
  }

  // Translate text with interpolation
  t(key, params = {}) {
    const translations = this.translations.get(this.currentLanguage);
    const fallbackTranslations = this.translations.get(this.fallbackLanguage);
    
    let text = translations?.[key] || fallbackTranslations?.[key] || key;
    
    // Handle interpolation
    if (params && typeof text === 'string') {
      text = text.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return text;
  }

  // Format number
  formatNumber(number, options = {}) {
    try {
      const formatter = this.formatters.get('number');
      return formatter.format(number);
    } catch (error) {
      console.error('[i18n] Number formatting error:', error);
      return number.toString();
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    try {
      const language = this.supportedLanguages[this.currentLanguage];
      const formatter = new Intl.NumberFormat(language.locale, {
        style: 'currency',
        currency
      });
      return formatter.format(amount);
    } catch (error) {
      console.error('[i18n] Currency formatting error:', error);
      return `${currency} ${amount}`;
    }
  }

  // Format date
  formatDate(date, options = {}) {
    try {
      const language = this.supportedLanguages[this.currentLanguage];
      const formatter = new Intl.DateTimeFormat(language.locale, options);
      return formatter.format(new Date(date));
    } catch (error) {
      console.error('[i18n] Date formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  }

  // Format relative time
  formatRelativeTime(date) {
    try {
      const now = new Date();
      const targetDate = new Date(date);
      const diffInSeconds = Math.floor((targetDate - now) / 1000);
      
      const rtf = this.formatters.get('relativeTime');
      if (rtf) {
        if (Math.abs(diffInSeconds) < 60) {
          return rtf.format(diffInSeconds, 'second');
        } else if (Math.abs(diffInSeconds) < 3600) {
          return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
        } else if (Math.abs(diffInSeconds) < 86400) {
          return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
        } else {
          return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
        }
      }
      
      // Fallback
      const minutes = Math.floor(Math.abs(diffInSeconds) / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        return this.t('time.daysAgo', { count: days });
      } else if (hours > 0) {
        return this.t('time.hoursAgo', { count: hours });
      } else if (minutes > 0) {
        return this.t('time.minutesAgo', { count: minutes });
      } else {
        return this.t('time.now');
      }
    } catch (error) {
      console.error('[i18n] Relative time formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  }

  // Get current language info
  getCurrentLanguage() {
    return this.supportedLanguages[this.currentLanguage];
  }

  // Get all supported languages
  getSupportedLanguages() {
    return Object.values(this.supportedLanguages);
  }

  // Check if language is RTL
  isRTL() {
    return this.supportedLanguages[this.currentLanguage]?.rtl || false;
  }

  // Add language change listener
  addLanguageChangeListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify language change
  notifyLanguageChange(newLanguage, previousLanguage) {
    this.listeners.forEach(callback => {
      try {
        callback(newLanguage, previousLanguage);
      } catch (error) {
        console.error('[i18n] Language change listener error:', error);
      }
    });
  }

  // Get translation keys for a namespace
  getTranslationKeys(namespace = '') {
    const translations = this.translations.get(this.currentLanguage) || {};
    
    if (!namespace) {
      return Object.keys(translations);
    }
    
    return Object.keys(translations).filter(key => key.startsWith(namespace));
  }

  // Check if translation exists
  hasTranslation(key) {
    const translations = this.translations.get(this.currentLanguage);
    const fallbackTranslations = this.translations.get(this.fallbackLanguage);
    
    return !!(translations?.[key] || fallbackTranslations?.[key]);
  }

  // Get missing translations
  getMissingTranslations() {
    const currentTranslations = this.translations.get(this.currentLanguage) || {};
    const fallbackTranslations = this.translations.get(this.fallbackLanguage) || {};
    
    const missing = [];
    
    for (const key of Object.keys(fallbackTranslations)) {
      if (!currentTranslations[key]) {
        missing.push(key);
      }
    }
    
    return missing;
  }

  // Pluralization helper
  plural(key, count, params = {}) {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    
    if (this.hasTranslation(pluralKey)) {
      return this.t(pluralKey, { count, ...params });
    }
    
    // Fallback to regular translation
    return this.t(key, { count, ...params });
  }

  // Get language direction class
  getDirectionClass() {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  // Get language-specific CSS classes
  getLanguageClasses() {
    const language = this.getCurrentLanguage();
    return [
      `lang-${language.code}`,
      `locale-${language.locale}`,
      language.rtl ? 'rtl' : 'ltr'
    ].join(' ');
  }
}

// Create singleton instance
const i18n = new I18nManager();

export default i18n;