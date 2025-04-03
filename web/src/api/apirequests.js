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
export const apiGetCompany = async (id) => {
  const response = await apiRequest("get", `/companies/${id}`);
  console.log("response", response);
  return response;
};

//! обновление данных компании
export const apiUpdateCompany = async (data, companyId) => {
  return await apiRequest("put", `/companies/${companyId}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! создание офиса
export const apiCreateOffice = async (data, companyId) => {
  return await apiRequest("post", `/offices/create/${companyId}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! получение всех офисов
export const apiGetOffices = async (companyId) => {
  return await apiRequest("get", `/offices/all/${companyId}`, {
    "Content-Type": "multipart/form-data",
  });
};

//! обновление данных офиса
export const apiUpdateOffice = async (data, officeId) => {
  return await apiRequest("put", `/offices/${officeId}`, data);
};

//! удаление офиса
export const apiDeleteOffice = async (officeId) => {
  return await apiRequest("delete", `/offices/${officeId}`);
};

//! создание этажа
export const apiCreateFloor = async (data) => {
  return await apiRequest("post", `/floors`, data);
};

//! получение всех этажей
export const apiGetFloors = async (companyId) => {
  return await apiRequest("get", `/floors/all/${companyId}`);
};
//! обновление данных этажа
export const apiUpdateFloor = async (data, id) => {
  return await apiRequest("put", `/floors/${id}`, data);
};

//! удаление этажа
export const apiDeleteFloor = async (id) => {
  return await apiRequest("delete", `/floors/${id}`);
};

//! получение всех пользователей
export const apiGetUsers = async (companyId) => {
  return await apiRequest("get", `/users/all/${companyId}`);
};

//! получение всех оборудований
export const apiGetEquipments = async (companyId) => {
  return await apiRequest("get", `/equipments/all/${companyId}`);
};

//! создание оборудования
export const apiCreateEquipment = async (data) => {
  return await apiRequest("post", `/equipments`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! обновление данных оборудования
export const apiUpdateEquipment = async (data, id) => {
  return await apiRequest("put", `/equipments/${id}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! удаление оборудования
export const apiDeleteEquipment = async (id) => {
  return await apiRequest("delete", `/equipments/${id}`);
};
