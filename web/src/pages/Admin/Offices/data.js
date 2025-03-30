import trashICon from "@assets/images/icons/trash.svg";
import editIcon from "@assets/images/icons/edit.svg";
import userIcon from "@assets/images/icons/user.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
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
    name: "Этажи",
    icon: officeIcon,
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
    name: "Адрес",
    key: "address",
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
    name: "Руководитель",
    key: "director",
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

export const testData = [
  {
    number: 1,
    name: "Офис А",
    address: "Улица 1, Город 1",
    phone: "+7 (123) 456-78-90",
    email: "contact@companyA.com",
    director: "Иван Иванов",
    floorsCount: 5,
    usersCount: 10,
    devices: 5,
  },
  {
    number: 2,
    name: "Офис Б",
    address: "Улица 2, Город 2",
    phone: "+7 (234) 567-89-01",
    email: "info@companyB.com",
    director: "Петр Петров",
    floorsCount: 5,
    usersCount: 10,
    devices: 5,
  },
  {
    number: 3,
    name: "Офис В",
    address: "Улица 3, Город 3",
    phone: "+7 (345) 678-90-12",
    email: "support@companyV.com",
    director: "Сидор Сидоров",
    floorsCount: 5,
    usersCount: 10,
    devices: 5,
  },
  {
    number: 4,
    name: "Офис Г",
    address: "Улица 4, Город 4",
    phone: "+7 (456) 789-01-23",
    email: "hello@companyG.com",
    director: "Анна Аннова",
    floorsCount: 5,
    usersCount: 10,
    devices: 5,
  },
  {
    number: 5,
    name: "Офис Д",
    address: "Улица 5, Город 5",
    phone: "+7 (567) 890-12-34",
    email: "contact@companyD.com",
    director: "Олег Олегов",
    floorsCount: 5,
    usersCount: 10,
    devices: 5,
  },
];
