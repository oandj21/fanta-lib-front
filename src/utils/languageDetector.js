/**
 * Detects if text is primarily Arabic script
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains Arabic characters
 */
export const isArabicText = (text) => {
  if (!text) return false;
  
  // Arabic Unicode range: \u0600-\u06FF\u0750-\u077F\u08A0-\u08FF
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  
  // Count Arabic characters
  const arabicChars = (text.match(arabicPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  // If more than 30% of non-space characters are Arabic, consider it RTL
  return totalChars > 0 && (arabicChars / totalChars) > 0.3;
};

/**
 * Determines the text direction based on book information
 * @param {Object} book - The book object
 * @returns {string} - 'rtl' or 'ltr'
 */
export const getBookDirection = (book) => {
  if (!book) return 'rtl'; // Default to RTL for Arabic site
  
  // Check title, author, and category for Arabic script
  const textToCheck = [
    book.titre,
    book.auteur,
    book.categorie,
    book.description
  ].filter(Boolean).join(' ');
  
  return isArabicText(textToCheck) ? 'rtl' : 'ltr';
};