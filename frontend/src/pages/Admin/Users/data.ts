import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";

export const paramMenu = [
  {
    name: "Редактировать",
    icon: editIcon,
    key: "edit",
  },
  {
    name: "Удалить",
    icon: trashICon,
    key: "delete",
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
    name: "Должность",
    key: "position",
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
];

export const editOfficeData = [
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
    name: "Должность",
    key: "position",
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
    name: "Офис",
    key: "office",
    type: "text",
  },
  {
    name: "Этаж",
    key: "floor",
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
];
