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
    name: "Сотрудники",
    icon: userIcon,
    key: "users",
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
    key: "devices",
  },
];

export const addFloorData = [
  {
    name: "Название",
    key: "name",
    type: "text",
  },
  {
    name: "Номер",
    key: "number",
    type: "text",
  },
  {
    name: "Офис",
    key: "office",
    type: "text",
  },
];

export const tableHeader = [
  {
    name: "№",
    key: "number",
  },
  {
    name: "Название",
    key: "name",
    type: "text",
  },
  {
    name: "Номер",
    key: "number",
    type: "text",
  },
  {
    name: "Офис",
    key: "office",
    type: "text",
  },
  {
    name: "Сотрудники",
    key: "users",
    type: "text",
  },
  {
    name: "Оборудование",
    key: "devices",
    type: "text",
  },
  {
    name: "План этажа",
    key: "image",
    type: "text",
  },
];
