import { createContext, useState, useContext, useEffect } from "react";
import { translations } from "../lib/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    // 1. Mirar si ya eligió idioma antes
    const savedLang = localStorage.getItem("appLanguage");
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // 2. Si no, detectar el del navegador
      const browserLang = navigator.language.startsWith("es") ? "es" : "en";
      setLanguage(browserLang);
    }
  }, []);

  const switchLanguage = (lang) => {
    // Reset swipe tutorial for new language so user sees it in correct language
    localStorage.removeItem(`dayclose_swipe_tutorial_${language}`);
    setLanguage(lang);
    localStorage.setItem("appLanguage", lang);
  };

  const t = (key, replacements = {}) => {
    let translation = translations[language]?.[key] ?? key;
    Object.entries(replacements).forEach(([variable, value]) => {
      translation = translation.replaceAll(`{{${variable}}}`, value);
    });
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
