import { useState, useEffect } from "react";

//!Хук для определения ширины экрана
export const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
};

export function useLocalStorage(key, initialValue) {
  // Получаем значение из localStorage или используем начальное значение
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Обновляем localStorage при изменении storedValue
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  // Возвращаем текущее значение и функцию для его обновления
  return [storedValue, setStoredValue];
}

//! хук для определения нажатий клавиш ctl+v
export const useClipboardDigits = () => {
  const [text, setText] = useState(""); // Для кода
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.ctrlKey &&
        (event.key === "v" ||
          event.key === "V" ||
          event.key === "м" ||
          event.key === "М")
      ) {
        event.preventDefault(); // Предотвращаем стандартное поведение
        navigator.clipboard
          .readText()
          .then((text) => {
            setText(text);
          })
          .catch((err) => {
            console.error("Failed to read clipboard contents:", err);
          });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return text;
};
