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
];

export const addOfficeData = [
  {
    name: "Оборудование",
    key: "equipment",
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
    name: "Описание",
    key: "description",
    type: "descr",
  },
];

export const tableHeader = [
  {
    name: "№",
    key: "number",
  },
  {
    name: "Оборудование",
    key: "equipment",
  },
  {
    name: "Заявитель",
    key: "user",
  },
  {
    name: "Описание",
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
    key: "imageUrl",
  },
  {
    name: "ТО",
    key: "toname",
  },
];
