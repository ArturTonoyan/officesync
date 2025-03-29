//! функция проверки не менее 8 символов
export function funEightSymbols(text) {
  if (!text) return { id: "0", done: false };
  const isValid = [...text].length >= 8; // Проверяем, что длина текста не менее 8 символов
  return { id: "0", done: isValid };
}

//! проверка не меенее 1 заглавной буквы
export function funCapitalLetter(text) {
  if (!text) return { id: "0", done: false };

  const hasCapitalLetter = /[A-ZА-ЯЁ]/.test(text);
  return { id: "1", done: hasCapitalLetter };
}
//! Проверяем, есть ли хотя бы одна цифра
export function funDigit(text) {
  if (!text) return { id: "0", done: false };

  const hasDigit = /\d/.test(text);
  return { id: "2", done: hasDigit };
}

//! проверка не менее 1 спец символа
export function funSpecialSymbol(text) {
  if (!text) return { id: "0", done: false };

  const hasSpecialSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(text);
  return { id: "3", done: hasSpecialSymbol };
}
