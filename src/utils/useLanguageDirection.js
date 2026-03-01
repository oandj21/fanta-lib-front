// hooks/useLanguageDirection.js
import { useMemo } from 'react';

const useLanguageDirection = () => {
  const detectLanguage = (text) => {
    if (!text) return 'unknown';
    
    // Arabic Unicode range: \u0600-\u06FF
    const arabicPattern = /[\u0600-\u06FF]/;
    
    // Check if text contains Arabic characters
    if (arabicPattern.test(text)) {
      return 'arabic';
    }
    
    // Check if text contains Latin characters
    const latinPattern = /[a-zA-Z]/;
    if (latinPattern.test(text)) {
      return 'latin';
    }
    
    return 'unknown';
  };

  const shouldBeRTL = (text) => {
    return detectLanguage(text) === 'arabic';
  };

  const getTextDirection = (text) => {
    return shouldBeRTL(text) ? 'rtl' : 'ltr';
  };

  const getTextAlign = (text) => {
    return shouldBeRTL(text) ? 'right' : 'left';
  };

  const getClassName = (text, baseClass, rtlClass = 'rtl-text', ltrClass = 'ltr-text') => {
    const direction = getTextDirection(text);
    return `${baseClass} ${direction === 'rtl' ? rtlClass : ltrClass}`;
  };

  return {
    detectLanguage,
    shouldBeRTL,
    getTextDirection,
    getTextAlign,
    getClassName
  };
};

export default useLanguageDirection;