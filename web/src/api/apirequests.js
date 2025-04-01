import api from './axios';
const URL = window.location.origin;
//! получение url c env
export let server =

//! Запрос на Выход
export const logout = async () => {
  const data = { refreshToken: localStorage.getItem('refreshToken') };
  try {
    const response = await api.post(`${server}/auth/logout`, data);
    return response;
  } catch (error) {
    alert('Ошибка при выходе из системы !');
  }
};

//! Запрос на регистрацию
export const apiRegister = async data => {
  try {
    const response = await api.post(`${server}/auth/register`, data);
    return response;
  } catch (error) {
    alert('Регистрация не прошла!');
  }
};



//! Запрос на авторизацию
export const LoginFunc = async UserData => {
  try {
    const response = await api.post(`${server}/auth/login`, UserData);
    const { participant, token } = response.data;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(participant));
    return response;
  } catch (error) {
    // alert('Пользователь не найден!');
    return error;
  }
};


