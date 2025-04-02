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
  const response = await apiRequest("post", "/auth/register", data);
  const { token } = response.data;
  localStorage.setItem("accessToken", token);
  return response;
};

//! Запрос на авторизацию
export const apiLogin = async (data) => {
  const response = await apiRequest("post", "/auth/login", data);
  const { token } = response.data;
  localStorage.setItem("accessToken", token);
  return response;
};

//! Запрос получение данных user
export const apiGetUser = async () => {
  return await apiRequest("get", "/users/me");
};

//! создание компании
export const apiCreateCompany = async (data) => {
  return await apiRequest("post", "/companies", data, {
    "Content-Type": "multipart/form-data",
  });
};

//! получение своей компании
export const apiGetCompany = async () => {
  return await apiRequest("get", "/companies/my");
};

//! обновление данных компании
export const apiUpdateCompany = async (data) => {
  return await apiRequest("put", "/companies/my", data, {
    "Content-Type": "multipart/form-data",
  });
};
