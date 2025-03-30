import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";

export const paramMenu = [
  {
    name: "Редактировать",
    icon: editIcon,
  },
  {
    name: "Удалить",
    icon: trashICon,
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
  },
];

export const addOfficeData = [
  {
    name: "Имя",
    key: "name",
    type: "text",
  },
  {
    name: "Фамилия",
    key: "surname",
    type: "text",
  },
  {
    name: "Отчество",
    key: "patronymic",
    type: "text",
  },
  {
    name: "Фото",
    key: "image",
    type: "text",
  },
  {
    name: "Должность",
    key: "position",
    type: "text",
  },
  {
    name: "Телефон",
    key: "phone",
    type: "text",
  },
  {
    name: "Почта",
    key: "email",
    type: "email",
  },
  {
    name: "Роль",
    key: "role",
    type: "text",
  },
  {
    name: "Пароль",
    key: "password",
    type: "password",
  },
  {
    name: "Подтверждение пароля",
    key: "passwordConfirm",
    type: "password",
  },
  {
    name: "Офис",
    key: "office",
    type: "text",
  },
  {
    name: "Этаж",
    key: "floor",
    type: "text",
  },
  {
    name: "Оборудование",
    key: "devices",
    type: "text",
  },
];

export const tableHeader = [
  {
    name: "№",
    key: "number",
  },
  {
    name: "ФИО",
    key: "fio",
  },
  {
    name: "Фото",
    key: "image",
  },
  {
    name: "Должность",
    key: "position",
  },
  {
    name: "Телефон",
    key: "phone",
  },
  {
    name: "Почта",
    key: "email",
  },
  {
    name: "Роль",
    key: "role",
  },
  {
    name: "Офис",
    key: "office",
  },
  {
    name: "Этаж",
    key: "floor",
  },
  {
    name: "Оборудование",
    key: "devices",
  },
];

export const testData = [
  {
    number: 1,
    fio: "Иванов Иван Иванович",
    position: "Директор",
    phone: "+7 (999) 999-99-99",
    email: "s9yG5@example.com",
    role: "admin",
    office: "Офис А",
    floor: "Этаж 1",
    devices: 5,
  },
  {
    number: 2,
    fio: "Петров Петр Петрович",
    position: "Менеджер",
    phone: "+7 (888) 888-88-88",
    email: "WpDyM@example.com",
    role: "manager",
    office: "Офис Б",
    floor: "Этаж 2",
    devices: 5,
  },
  {
    number: 3,
    fio: "Сидоров Сидор Сидорович",
    position: "Сотрудник",
    phone: "+7 (777) 777-77-77",
    email: "ZK2tF@example.com",
    role: "user",
    office: "Офис В",
    floor: "Этаж 3",
    devices: 5,
  },
];
