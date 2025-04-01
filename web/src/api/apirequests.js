import api from "./axios";
export const server = process.env.REACT_APP_API_URL || "http://localhost:3004";

// Универсальная функция для выполнения запросов
export const apiRequest = async (
  method,
  endpoint,
  data = null,
  headers = {}
) => {
  try {
    const config = {
      method,
      url: `${server}${endpoint}`,
      headers,
      data,
    };

    const response = await api(config);
    return response;
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    throw error; // Пробрасываем ошибку дальше для обработки
  }
};

//! Запрос на регистрацию
export const apiRegister = async (data) => {
  return await apiRequest("post", "/auth/register", data);
};

//! Запрос на авторизацию
export const apiLogin = async (UserData) => {
  const response = await apiRequest("post", "/auth/login", UserData);
  const { participant, token } = response.data;
  localStorage.setItem("accessToken", token);
  return response;
};
