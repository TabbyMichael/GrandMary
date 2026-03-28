import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type Locale } from "@/lib/translations";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const LocaleContext = createContext<LocaleContextType>({ locale: "en", setLocale: () => {} });
const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {} });

export const useLocale = () => useContext(LocaleContext);
export const useTheme = () => useContext(ThemeContext);

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem("locale") as Locale) || "en";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  );
};
