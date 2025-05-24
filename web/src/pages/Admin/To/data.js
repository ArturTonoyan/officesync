import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import userIcon from "@assets/images/icons/user.svg";
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
    name: "Сотрудник",
    icon: userIcon,
    key: "users",
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
    key: "devices",
  },
];

export const addOfficeData = [
  {
    name: "Оборудование",
    key: "equipment",
    type: "text",
  },
  {
    name: "Исполнитель",
    key: "user",
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
    type: "file",
  },
  {
    name: "Неполадка",
    key: "problem",
    type: "text",
  },

  {
    name: "Комментарии",
    key: "description",
    type: "descr",
  },
];

export const tableHeader = [
  {
    name: "№",
    key: "number",
    type: "text",
  },
  {
    name: "Оборудование",
    key: "equipment",
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
    name: "Дата создания",
    key: "createdAt",
  },
];
