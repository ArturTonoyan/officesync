import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import userIcon from "@assets/images/icons/user.svg";
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
    name: "Сотрудник",
    icon: userIcon,
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
  },
];

export const addOfficeData = [
  {
    name: "Оборудование",
    key: "device",
    type: "text",
  },
  {
    name: "Исполнитель",
    key: "user",
    type: "text",
  },
  {
    name: "Комментарии",
    key: "description",
    type: "text",
  },
  {
    name: "Статус",
    key: "status",
    type: "text",
  },
  {
    name: "Срочность",
    key: "urgency",
    type: "text",
  },
  {
    name: "Фото",
    key: "image",
    type: "text",
  },
  {
    name: "Неполадка",
    key: "problem",
    type: "text",
  },
  {
    name: "Стоимость",
    key: "cost",
    type: "text",
  },
];

export const tableHeader = [
  {
    name: "Оборудование",
    key: "device",
  },
  {
    name: "Исполнитель",
    key: "user",
  },
  {
    name: "Комментарии",
    key: "description",
  },
  {
    name: "Статус",
    key: "status",
  },
  {
    name: "Срочность",
    key: "urgency",
  },
  {
    name: "Фото",
    key: "image",
  },
  {
    name: "Неполадка",
    key: "problem",
  },
  {
    name: "Стоимость",
    key: "cost",
  },
];

export const testData = [
  {
    id: 1,
    device: "Название оборудования",
    user: "ФИО",
    description: "Описание",
    status: "Статус",
    urgency: "Срочность",
    image: "Фото",
    problem: "Неполадка",
    cost: "Стоимость",
  },
  {
    id: 2,
    device: "Название оборудования",
    user: "ФИО",
    description: "Описание",
    status: "Статус",
    urgency: "Срочность",
    image: "Фото",
    problem: "Неполадка",
    cost: "Стоимость",
  },
];
