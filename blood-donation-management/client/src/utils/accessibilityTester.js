/**
 * Accessibility Tester
 * Automated accessibility testing and validation
 */

class AccessibilityTester {
  constructor() {
    this.tests = new Map();
    this.results = [];
    this.isRunning = false;
    
    this.initializeTests();
  }

  // Initialize all accessibility tests
  initializeTests() {
    // WCAG 2.1 Level AA Tests
    this.tests.set('images-alt-text', this.testImagesAltText.bind(this));
    this.tests.set('form-labels', this.testFormLabels.bind(this));
    this.tests.set('button-names', this.testButtonNames.bind(this));
    this.tests.set('link-names', this.testLinkNames.bind(this));
    this.tests.set('heading-structure', this.testHeadingStructure.bind(this));
    this.tests.set('color-contrast', this.testColorContrast.bind(this));
    this.tests.set('focus-indicators', this.testFocusIndicators.bind(this));
    this.tests.set('keyboard-navigation', this.testKeyboardNavigation.bind(this));
    this.tests.set('aria-labels', this.testAriaLabels.bind(this));
    this.tests.set('semantic-structure', this.testSemanticStructure.bind(this));
    this.tests.set('touch-targets', this.testTouchTargets.bind(this));
    this.tests.set('skip-links', this.testSkipLinks.bind(this));
    this.tests.set('live-regions', this.testLiveRegions.bind(this));
    this.tests.set('language-attributes', this.testLanguageAttributes.bind(this));
    this.tests.set('page-title', this.testPageTitle.bind(this));
  }

  // Run all accessibility tests
  async runAllTests() {
    if (this.isRunning) {
      console.warn('[A11y Tester] Tests already running');
      return this.results;
    }

    this.isRunning = true;
    this.results = [];

    console.group('[A11y Tester] Running accessibility tests...');

    for (const [testName, testFunction] of this.tests) {
      try {
        const result = await testFunction();
        this.results.push({
          test: testName,
          ...result,
          timestamp: Date.now()
        });
        
        console.log(`✓ ${testName}:`, result.passed ? 'PASS' : 'FAIL', result.issues?.length || 0, 'issues');
      } catch (error) {
        console.error(`✗ ${testName}: ERROR`, error);
        this.results.push({
          test: testName,
          passed: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }

    console.groupEnd();
    this.isRunning = false;

    return this.generateReport();
  }

  // Test images have alt text
  testImagesAltText() {
    const images = document.querySelectorAll('img');
    const issues = [];

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.src;
      
      if (alt === null) {
        issues.push({
          element: img,
          issue: 'Missing alt attribute',
          severity: 'error',
          wcag: '1.1.1',
          suggestion: 'Add alt attribute with descriptive text or empty alt="" for decorative images'
        });
      } else if (alt === src || alt.includes('image') || alt.includes('picture')) {
        issues.push({
          element: img,
          issue: 'Non-descriptive alt text',
          severity: 'warning',
          wcag: '1.1.1',
          suggestion: 'Use more descriptive alt text that explains the image content'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: images.length,
      description: 'Images must have appropriate alternative text'
    };
  }

  // Test form labels
  testFormLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const issues = [];

    inputs.forEach((input) => {
      const id = input.id;
      const type = input.type;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      
      // Skip hidden inputs and buttons
      if (type === 'hidden' || type === 'button' || type === 'submit' || type === 'reset') {
        return;
      }

      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          element: input,
          issue: 'Form control missing label',
          severity: 'error',
          wcag: '1.3.1',
          suggestion: 'Add a <label> element, aria-label, or aria-labelledby attribute'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: inputs.length,
      description: 'Form controls must have accessible labels'
    };
  }

  // Test button names
  testButtonNames() {
    const buttons = document.querySelectorAll('button, [role="button"]');
    const issues = [];

    buttons.forEach((button) => {
      const textContent = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      const title = button.getAttribute('title');

      if (!textContent && !ariaLabel && !ariaLabelledBy && !title) {
        issues.push({
          element: button,
          issue: 'Button missing accessible name',
          severity: 'error',
          wcag: '4.1.2',
          suggestion: 'Add text content, aria-label, aria-labelledby, or title attribute'
        });
      } else if (textContent && (textContent.toLowerCase() === 'click here' || textContent.toLowerCase() === 'read more')) {
        issues.push({
          element: button,
          issue: 'Non-descriptive button text',
          severity: 'warning',
          wcag: '2.4.4',
          suggestion: 'Use more descriptive button text that explains the action'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: buttons.length,
      description: 'Buttons must have accessible names'
    };
  }

  // Test link names
  testLinkNames() {
    const links = document.querySelectorAll('a[href]');
    const issues = [];

    links.forEach((link) => {
      const textContent = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const ariaLabelledBy = link.getAttribute('aria-labelledby');
      const title = link.getAttribute('title');

      if (!textContent && !ariaLabel && !ariaLabelledBy && !title) {
        issues.push({
          element: link,
          issue: 'Link missing accessible name',
          severity: 'error',
          wcag: '4.1.2',
          suggestion: 'Add text content, aria-label, aria-labelledby, or title attribute'
        });
      } else if (textContent && (textContent.toLowerCase() === 'click here' || textContent.toLowerCase() === 'read more' || textContent.toLowerCase() === 'here')) {
        issues.push({
          element: link,
          issue: 'Non-descriptive link text',
          severity: 'warning',
          wcag: '2.4.4',
          suggestion: 'Use more descriptive link text that explains the destination'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: links.length,
      description: 'Links must have accessible names'
    };
  }

  // Test heading structure
  testHeadingStructure() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let previousLevel = 0;

    // Check if page has h1
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      issues.push({
        element: document.body,
        issue: 'Page missing h1 heading',
        severity: 'error',
        wcag: '1.3.1',
        suggestion: 'Add an h1 heading to identify the main content of the page'
      });
    } else if (h1Count > 1) {
      issues.push({
        element: document.body,
        issue: 'Multiple h1 headings found',
        severity: 'warning',
        wcag: '1.3.1',
        suggestion: 'Use only one h1 per page for the main heading'
      });
    }

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      const textContent = heading.textContent?.trim();

      if (!textContent) {
        issues.push({
          element: heading,
          issue: 'Empty heading',
          severity: 'error',
          wcag: '1.3.1',
          suggestion: 'Add descriptive text to the heading'
        });
      }

      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          element: heading,
          issue: `Heading level skipped (h${previousLevel} to h${level})`,
          severity: 'warning',
          wcag: '1.3.1',
          suggestion: 'Use heading levels in sequential order'
        });
      }

      previousLevel = level;
    });

    return {
      passed: issues.length === 0,
      issues,
      total: headings.length,
      description: 'Headings must be properly structured'
    };
  }

  // Test color contrast
  testColorContrast() {
    const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, li, td, th, label');
    const issues = [];

    textElements.forEach((element) => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const requiredRatio = isLargeText ? 3 : 4.5;

        if (contrast < requiredRatio) {
          issues.push({
            element,
            issue: `Low color contrast (${contrast.toFixed(2)}:1, required: ${requiredRatio}:1)`,
            severity: contrast < 3 ? 'error' : 'warning',
            wcag: '1.4.3',
            suggestion: `Increase contrast between text and background colors`,
            details: { contrast, required: requiredRatio, isLargeText }
          });
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: textElements.length,
      description: 'Text must have sufficient color contrast'
    };
  }

  // Test focus indicators
  testFocusIndicators() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const issues = [];

    focusableElements.forEach((element) => {
      // Simulate focus to check for focus indicators
      element.focus();
      const styles = getComputedStyle(element);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;

      if (outline === 'none' && outlineWidth === '0px' && !boxShadow.includes('inset')) {
        issues.push({
          element,
          issue: 'Missing focus indicator',
          severity: 'error',
          wcag: '2.4.7',
          suggestion: 'Add visible focus indicator using outline, box-shadow, or border'
        });
      }
    });

    // Remove focus from last element
    if (document.activeElement) {
      document.activeElement.blur();
    }

    return {
      passed: issues.length === 0,
      issues,
      total: focusableElements.length,
      description: 'Focusable elements must have visible focus indicators'
    };
  }

  // Test keyboard navigation
  testKeyboardNavigation() {
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
    );
    const issues = [];

    interactiveElements.forEach((element) => {
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');

      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          element,
          issue: 'Positive tabindex found',
          severity: 'warning',
          wcag: '2.4.3',
          suggestion: 'Use tabindex="0" or remove tabindex to maintain natural tab order'
        });
      }

      // Check custom interactive elements have proper roles
      if (element.tagName.toLowerCase() === 'div' && !role && element.onclick) {
        issues.push({
          element,
          issue: 'Interactive div missing role',
          severity: 'error',
          wcag: '4.1.2',
          suggestion: 'Add role="button" or use a proper button element'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: interactiveElements.length,
      description: 'Interactive elements must be keyboard accessible'
    };
  }

  // Test ARIA labels
  testAriaLabels() {
    const ariaElements = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
    const issues = [];

    ariaElements.forEach((element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');

      if (labelledBy) {
        const labelIds = labelledBy.split(' ');
        labelIds.forEach((id) => {
          if (!document.getElementById(id)) {
            issues.push({
              element,
              issue: `aria-labelledby references non-existent ID: ${id}`,
              severity: 'error',
              wcag: '4.1.2',
              suggestion: 'Ensure referenced ID exists in the document'
            });
          }
        });
      }

      if (describedBy) {
        const descriptionIds = describedBy.split(' ');
        descriptionIds.forEach((id) => {
          if (!document.getElementById(id)) {
            issues.push({
              element,
              issue: `aria-describedby references non-existent ID: ${id}`,
              severity: 'error',
              wcag: '4.1.2',
              suggestion: 'Ensure referenced ID exists in the document'
            });
          }
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: ariaElements.length,
      description: 'ARIA references must point to valid elements'
    };
  }

  // Test semantic structure
  testSemanticStructure() {
    const issues = [];

    // Check for main landmark
    const main = document.querySelector('main, [role="main"]');
    if (!main) {
      issues.push({
        element: document.body,
        issue: 'Missing main landmark',
        severity: 'error',
        wcag: '1.3.1',
        suggestion: 'Add <main> element or role="main" to identify main content'
      });
    }

    // Check for navigation landmark
    const nav = document.querySelector('nav, [role="navigation"]');
    if (!nav) {
      issues.push({
        element: document.body,
        issue: 'Missing navigation landmark',
        severity: 'warning',
        wcag: '1.3.1',
        suggestion: 'Add <nav> element or role="navigation" for site navigation'
      });
    }

    // Check for lists
    const listItems = document.querySelectorAll('li');
    listItems.forEach((li) => {
      const parent = li.parentElement;
      if (parent && !['ul', 'ol', 'menu'].includes(parent.tagName.toLowerCase()) && parent.getAttribute('role') !== 'list') {
        issues.push({
          element: li,
          issue: 'List item not in proper list container',
          severity: 'error',
          wcag: '1.3.1',
          suggestion: 'Wrap list items in <ul>, <ol>, or element with role="list"'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: 1,
      description: 'Page must have proper semantic structure'
    };
  }

  // Test touch targets
  testTouchTargets() {
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"]'
    );
    const issues = [];

    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG 2.1 AA requirement

      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          element,
          issue: `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px, minimum: ${minSize}x${minSize}px)`,
          severity: 'warning',
          wcag: '2.5.5',
          suggestion: 'Increase touch target size to at least 44x44 pixels'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: interactiveElements.length,
      description: 'Touch targets must be at least 44x44 pixels'
    };
  }

  // Test skip links
  testSkipLinks() {
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const issues = [];
    let hasSkipToMain = false;

    skipLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      const text = link.textContent?.toLowerCase();

      if (text && (text.includes('skip') || text.includes('main'))) {
        hasSkipToMain = true;
        
        if (!target) {
          issues.push({
            element: link,
            issue: `Skip link target not found: ${href}`,
            severity: 'error',
            wcag: '2.4.1',
            suggestion: 'Ensure skip link target exists in the document'
          });
        }
      }
    });

    if (!hasSkipToMain) {
      issues.push({
        element: document.body,
        issue: 'Missing skip to main content link',
        severity: 'warning',
        wcag: '2.4.1',
        suggestion: 'Add skip link to allow keyboard users to bypass navigation'
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      total: skipLinks.length,
      description: 'Skip links must be provided for keyboard navigation'
    };
  }

  // Test live regions
  testLiveRegions() {
    const liveRegions = document.querySelectorAll('[aria-live]');
    const issues = [];

    // Check if live regions exist for dynamic content
    const dynamicContent = document.querySelectorAll('[data-dynamic], .alert, .notification, .status');
    
    if (dynamicContent.length > 0 && liveRegions.length === 0) {
      issues.push({
        element: document.body,
        issue: 'Dynamic content found but no live regions',
        severity: 'warning',
        wcag: '4.1.3',
        suggestion: 'Add aria-live regions to announce dynamic content changes'
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      total: liveRegions.length,
      description: 'Live regions must be provided for dynamic content'
    };
  }

  // Test language attributes
  testLanguageAttributes() {
    const issues = [];
    const html = document.documentElement;
    const lang = html.getAttribute('lang');

    if (!lang) {
      issues.push({
        element: html,
        issue: 'Missing lang attribute on html element',
        severity: 'error',
        wcag: '3.1.1',
        suggestion: 'Add lang attribute to html element (e.g., lang="en")'
      });
    }

    // Check for content in different languages
    const langElements = document.querySelectorAll('[lang]');
    langElements.forEach((element) => {
      const elementLang = element.getAttribute('lang');
      if (!elementLang || elementLang.length < 2) {
        issues.push({
          element,
          issue: 'Invalid lang attribute value',
          severity: 'error',
          wcag: '3.1.2',
          suggestion: 'Use valid language code (e.g., "en", "es", "fr")'
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      total: langElements.length + 1,
      description: 'Language must be specified for content'
    };
  }

  // Test page title
  testPageTitle() {
    const issues = [];
    const title = document.querySelector('title');
    const titleText = title?.textContent?.trim();

    if (!title || !titleText) {
      issues.push({
        element: document.head,
        issue: 'Missing or empty page title',
        severity: 'error',
        wcag: '2.4.2',
        suggestion: 'Add descriptive title element to document head'
      });
    } else if (titleText.length < 10) {
      issues.push({
        element: title,
        issue: 'Page title too short',
        severity: 'warning',
        wcag: '2.4.2',
        suggestion: 'Use more descriptive page title'
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      total: 1,
      description: 'Page must have descriptive title'
    };
  }

  // Calculate contrast ratio between two colors
  calculateContrastRatio(color1, color2) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Parse CSS color to RGB
  parseColor(color) {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    
    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  }

  // Get relative luminance
  getLuminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const allIssues = this.results.reduce((acc, result) => {
      if (result.issues) {
        acc.push(...result.issues);
      }
      return acc;
    }, []);
    
    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;
    
    const score = Math.round((passedTests / totalTests) * 100);
    
    const report = {
      summary: {
        score,
        totalTests,
        passedTests,
        failedTests,
        totalIssues: allIssues.length,
        errorCount,
        warningCount
      },
      results: this.results,
      issues: allIssues,
      recommendations: this.generateRecommendations(allIssues),
      timestamp: Date.now()
    };
    
    console.group('[A11y Report]');
    console.log(`Score: ${score}/100`);
    console.log(`Tests: ${passedTests}/${totalTests} passed`);
    console.log(`Issues: ${errorCount} errors, ${warningCount} warnings`);
    console.groupEnd();
    
    return report;
  }

  // Generate recommendations based on issues
  generateRecommendations(issues) {
    const recommendations = [];
    const issueTypes = {};
    
    // Group issues by type
    issues.forEach(issue => {
      const key = issue.issue.split('(')[0].trim();
      if (!issueTypes[key]) {
        issueTypes[key] = [];
      }
      issueTypes[key].push(issue);
    });
    
    // Generate recommendations for each issue type
    Object.entries(issueTypes).forEach(([type, typeIssues]) => {
      const count = typeIssues.length;
      const severity = typeIssues.some(i => i.severity === 'error') ? 'high' : 'medium';
      const wcag = typeIssues[0].wcag;
      
      recommendations.push({
        type,
        count,
        severity,
        wcag,
        suggestion: typeIssues[0].suggestion,
        priority: severity === 'high' ? 1 : 2
      });
    });
    
    // Sort by priority and count
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.count - a.count;
    });
  }

  // Run specific test
  async runTest(testName) {
    const testFunction = this.tests.get(testName);
    if (!testFunction) {
      throw new Error(`Test '${testName}' not found`);
    }
    
    return await testFunction();
  }

  // Get available tests
  getAvailableTests() {
    return Array.from(this.tests.keys());
  }
}

// Create singleton instance
const accessibilityTester = new AccessibilityTester();

export default accessibilityTester;