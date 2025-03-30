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
    name: "Сотрудники",
    icon: userIcon,
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
  },
];

export const addOfficeData = [
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
];

export const testData = [
  {
    number: 1,
    name: "Этаж 1",
    office: "Офис А",
    users: 10,
    devices: 5,
  },
  {
    number: 2,
    name: "Этаж 2",
    office: "Офис Б",
    users: 10,
    devices: 5,
  },
  {
    number: 3,
    name: "Этаж 3",
    office: "Офис В",
    users: 10,
    devices: 5,
  },
];
