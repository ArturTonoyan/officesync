import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";

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
    name: "Объект",
    icon: editIcon,
    key: "object",
  },
  {
    name: "Неполадки",
    icon: editIcon,
    key: "problems",
  },
];

export const paramMenuNoEdit = [
  {
    name: "Неполадки",
    icon: editIcon,
    key: "problems",
  },
];

export const addOfficeData = [
  {
    name: "Название",
    key: "name",
    type: "text",
  },
  {
    name: "Инвентарный номер",
    key: "inventoryNumber",
    type: "text",
  },
  {
    name: "Тип",
    key: "type",
    type: "text",
  },
  {
    name: "Этаж",
    key: "floor",
    type: "text",
  },
  {
    name: "Офис",
    key: "office",
    type: "text",
  },
  {
    name: "Сотрудник",
    key: "user",
    type: "text",
  },
  {
    name: "Описание",
    key: "description",
    type: "text",
  },
  {
    name: "Стоимость",
    key: "cost",
    type: "text",
  },
  {
    name: "Максимальная наработка",
    key: "maxWarranty",
    type: "text",
  },
  {
    name: "Текущая наработка",
    key: "currentWarranty",
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
  },
  {
    name: "Инвентарный номер",
    key: "inventoryNumber",
  },
  {
    name: "Тип",
    key: "type",
  },
  {
    name: "Этаж",
    key: "floor",
  },
  {
    name: "Офис",
    key: "office",
    type: "text",
  },
  {
    name: "Сотрудник",
    key: "user",
  },
  {
    name: "Описание",
    key: "description",
  },
  {
    name: "Стоимость",
    key: "cost",
  },
  {
    name: "Максимальная наработка",
    key: "maxWarranty",
  },
  {
    name: "Текущая наработка",
    key: "currentWarranty",
  },

  {
    name: "Износ",
    key: "wear",
  },
  // {
  //   name: "Вероятность выхода из строя",
  //   key: "prob",
  // },
];
