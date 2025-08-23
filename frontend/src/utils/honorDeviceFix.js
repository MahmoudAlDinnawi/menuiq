/**
 * Honor Device Detection and Fix
 * Handles text rendering issues specific to Honor/Huawei devices
 */

export const isHonorDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('honor') || 
         userAgent.includes('huawei') || 
         userAgent.includes('emui') ||
         userAgent.includes('harmonyos');
};

export const applyHonorFixes = () => {
  if (!isHonorDevice()) return;
  
  console.log('Honor device detected - applying text rendering fixes');
  
  // Add class to body for CSS targeting
  document.body.classList.add('honor-device');
  
  // Disable text auto-correction for all Arabic text
  const arabicElements = document.querySelectorAll('[dir="rtl"], [lang="ar"]');
  arabicElements.forEach(element => {
    element.setAttribute('autocorrect', 'off');
    element.setAttribute('autocapitalize', 'off');
    element.setAttribute('spellcheck', 'false');
    element.style.webkitFontSmoothing = 'antialiased';
  });
  
  // Override any text content that might be injected
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        const text = mutation.target.nodeValue;
        // Check if text contains suspicious religious words
        const suspiciousPatterns = /الله|محمد|قرآن|إسلام|صلاة|مسجد|دين|نبي|رسول/g;
        if (suspiciousPatterns.test(text)) {
          console.warn('Suspicious text injection detected and blocked:', text);
          // Revert to original text
          mutation.target.nodeValue = mutation.oldValue || '';
        }
      }
    });
  });
  
  // Start observing Arabic content areas
  const contentAreas = document.querySelectorAll('.menu-item-name, .menu-item-description, [dir="rtl"]');
  contentAreas.forEach(area => {
    observer.observe(area, {
      characterData: true,
      subtree: true,
      characterDataOldValue: true
    });
  });
  
  // Force re-render of Arabic text
  setTimeout(() => {
    arabicElements.forEach(element => {
      const originalDisplay = element.style.display;
      element.style.display = 'none';
      element.offsetHeight; // Force reflow
      element.style.display = originalDisplay;
    });
  }, 100);
};

// Additional CSS for Honor devices
export const getHonorDeviceStyles = () => {
  if (!isHonorDevice()) return '';
  
  return `
    .honor-device [dir="rtl"],
    .honor-device [lang="ar"],
    .honor-device .arabic-text {
      font-family: Arial, sans-serif !important;
      -webkit-font-feature-settings: "liga" 0, "clig" 0, "dlig" 0 !important;
      font-feature-settings: "liga" 0, "clig" 0, "dlig" 0 !important;
      text-rendering: geometricPrecision !important;
      word-spacing: normal !important;
      letter-spacing: normal !important;
    }
    
    .honor-device * {
      -webkit-locale: "en-US" !important;
    }
  `;
};