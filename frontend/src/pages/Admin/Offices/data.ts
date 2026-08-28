import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import userIcon from "@assets/images/icons/user.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";

export const typeOwnerships = [
  { name: "Арендованный", id: "1" },
  { name: "Собственный", id: "2" },
];

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
    name: "Этажи",
    icon: officeIcon,
    key: "floors",
  },
  {
    name: "Оборудование",
    icon: deviceIcon,
    key: "devices",
  },
];

export const addOfficeData = [
  {
    name: "Название",
    key: "name",
    type: "text",
  },
  {
    name: "Адрес",
    key: "address",
    type: "text",
  },
  {
    name: "Телефон",
    key: "phone",
    type: "text",
    placeholder: "+7 (___) ___-__-__",
  },
  {
    name: "Почта",
    key: "email",
    type: "email",
  },
  {
    name: "Руководитель",
    key: "director",
    type: "text",
  },
  {
    name: "Тип собственности",
    key: "typeOwnership",
    type: "text",
  },
  {
    name: "Арендодатель",
    key: "renter",
    type: "text",
  },
  {
    name: "Договор",
    key: "contract",
    type: "file",
    accept: "application/pdf",
  },
  {
    name: "Дата начала аренды",
    key: "dateStart",
    type: "date",
  },
  {
    name: "Дата окончания аренды",
    key: "dateEnd",
    type: "date",
  },
  {
    name: "Стоимость аренды в месяц",
    key: "cost",
    type: "number",
  },
  {
    name: "Контакт арендодателя",
    key: "renterContact",
    type: "text",
    placeholder: "+7 (___) ___-__-__",
  },
  {
    name: "Площадь кв. м.",
    key: "area",
    type: "number",
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
    name: "Адрес",
    key: "address",
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
    name: "Руководитель",
    key: "director",
  },
  {
    name: "Тип собственности",
    key: "typeOwnership",
    type: "text",
  },
  {
    name: "Арендодатель",
    key: "renter",
    type: "text",
  },
  {
    name: "Договор",
    key: "contract",
    type: "file",
    accept: "application/pdf",
  },
  {
    name: "Дата начала аренды",
    key: "dateStart",
    type: "date",
  },
  {
    name: "Дата окончания аренды",
    key: "dateEnd",
    type: "date",
  },
  {
    name: "Стоимость аренды в месяц",
    key: "cost",
    type: "number",
  },
  {
    name: "Контакт арендодателя",
    key: "renterContact",
    type: "text",
    placeholder: "+7 (___) ___-__-__",
  },
  {
    name: "Площадь кв. м.",
    key: "area",
    type: "number",
  },
  {
    name: "Этажи",
    key: "floorsCount",
  },
  {
    name: "Сотрудники",
    key: "usersCount",
  },
  {
    name: "Оборудование",
    key: "devices",
    type: "text",
  },
];
