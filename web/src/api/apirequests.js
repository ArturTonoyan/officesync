import api from "./axios";
import { createLogger } from "../utils/logger";
export const server = process.env.REACT_APP_API_URL || "http://localhost:3004";
const neiroServer = process.env.REACT_APP_NEIRO_URL || "http://localhost:3014";
const logger = createLogger("api");

const trackedEndpoints = ["/chat/ask", "/equipments"];

const isTrackedEndpoint = (endpoint = "") =>
  trackedEndpoints.some((prefix) => endpoint.startsWith(prefix));

// Универсальная функция для выполнения запросов
export const apiRequest = async (
  method,
  endpoint,
  data = null,
  headers = {},
  serv = server,
) => {
  const startedAt = Date.now();

  try {
    const config = {
      method,
      url: `${serv}${endpoint}`,
      headers,
      data,
    };

    if (isTrackedEndpoint(endpoint)) {
      logger.info("request_started", {
        method,
        endpoint,
      });
    }

    const response = await api(config);

    if (isTrackedEndpoint(endpoint)) {
      logger.info("request_finished", {
        method,
        endpoint,
        status: response?.status,
        durationMs: Date.now() - startedAt,
      });
    }

    return response;
  } catch (error) {
    logger.error("request_failed", error, {
      method,
      endpoint,
      durationMs: Date.now() - startedAt,
    });
    return error; // Пробрасываем ошибку дальше для обработки
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
  if (!response?.data) {
    alert(response?.response?.data?.message);
    return response;
  }
  const { token } = response?.data;
  localStorage.setItem("accessToken", token);
  return response;
};

//! Запрос получение данных user
export const apiGetUser = async () => {
  return await apiRequest("get", "/users/me");
};

//! добавление пользователя
export const apiCreateUser = async (data) => {
  return await apiRequest("post", "/users/create", data);
};

//! удаление пользователя
export const apiDeleteUser = async (id) => {
  return await apiRequest("delete", `/users/${id}`);
};

//! обновление данных сотрудника
export const apiUpdateUser = async (data, id) => {
  return await apiRequest("put", `/users/${id}`, data);
};

export const apiUpdateUserProfile = async (data) => {
  return await apiRequest("put", `/users`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! получение всех ролей
export const apiGetRoles = async () => {
  return await apiRequest("get", "/roles");
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
  return await apiRequest("put", `/offices/${officeId}`, data, {
    "Content-Type": "multipart/form-data",
  });
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

//! загрузка фото этажа
export const apiUpdateFloorImage = async (image, id) => {
  return await apiRequest("put", `/floors/upload_image/${id}`, image, {
    "Content-Type": "multipart/form-data",
  });
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

//! добавить обьект карты
export const apiEddElement = async (data) => {
  return await apiRequest("post", `/elements`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! обновить обьект карты
export const apiUpdateElement = async (id, data) => {
  return await apiRequest("put", `/elements/${id}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! сохранить все обьекты карты
export const apiEddElements = async (data) => {
  return await apiRequest("post", `/elements/bulk`, data);
};

//! получение всех обьектов карты
export const apiGetElements = async (floorId) => {
  return await apiRequest("get", `/elements/all/${floorId}`);
};

//! удаление объкта
export const apiDeleteElement = async (id) => {
  return await apiRequest("delete", `/elements/${id}`);
};

//! Запрос получение данных неполадок
export const apiGetProblems = async (companyId) => {
  return await apiRequest("get", `/problems/all/${companyId}`);
};

//! создание неполадки
export const apiCreateProblem = async (data) => {
  return await apiRequest("post", `/problems`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! редактирование неполадки
export const apiEditProblem = async (id, data) => {
  return await apiRequest("put", `/problems/${id}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! удаление неполадки
export const apiDeleteProblem = async (id) => {
  return await apiRequest("delete", `/problems/${id}`);
};

//! Запрос получение данных неполадок
export const apiGetTos = async (companyId) => {
  return await apiRequest("get", `/tos/all/${companyId}`);
};

//! создание неполадки
export const apiCreateTo = async (data) => {
  return await apiRequest("post", `/tos`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! редактирование неполадки
export const apiEditTo = async (id, data) => {
  return await apiRequest("put", `/tos/${id}`, data, {
    "Content-Type": "multipart/form-data",
  });
};

//! удаление неполадки
export const apiDeleteTo = async (id) => {
  return await apiRequest("delete", `/tos/${id}`);
};

//! создание бронирования
export const apiCreateReserveds = async (data) => {
  return await apiRequest("post", `/elements/reserveds`, data);
};

//! получение всех бронирований по параметрам
export const apiGetReserveds = async (date, elementId) => {
  return await apiRequest(
    "get",
    `/elements/reserveds?date=${date}&elementId=${elementId}`,
  );
};

//! получение всех моих бронирований
export const apiGetReservedsMy = async (userId) => {
  return await apiRequest("get", `/elements/reserveds/my/${userId}`);
};

//! получение всех бронирований елемента
export const apiGetReservedsElements = async (elementId) => {
  return await apiRequest("get", `/elements/reserveds/${elementId}`);
};

//! удаление бронирования
export const apiDeleteReserved = async (id) => {
  return await apiRequest("delete", `/elements/reserveds/${id}`);
};

//! обращение к нейронной сети
export const apiPostNeural = async (data) => {
  return await apiRequest("post", `/predict_wear`, data, {}, neiroServer);
};

//! запрос к AI-чату
export const apiAskChat = async (data) => {
  return await apiRequest("post", `/chat/ask`, data);
};
