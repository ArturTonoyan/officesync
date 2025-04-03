import { useEffect, useState } from "react";
import styles from "./Offices.module.scss";
import { addOfficeData, paramMenu, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import {
  apiCreateOffice,
  apiDeleteOffice,
  apiGetOffices,
  apiUpdateOffice,
} from "../../../api/apirequests";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";

function Offices() {
  const user = useSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});
  const [createOfficeData, setCreateOfficeData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const {
    status,
    data: query,
    error,
    refetch,
  } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (query?.data) {
      setTableData(query?.data);
      setOriginalData(query?.data);
    }
  }, [query?.data]);

  //! функция создания офиса
  const funCreateOffice = () => {
    const formData = new FormData();
    formData.append("name", createOfficeData.name);
    formData.append("address", createOfficeData.address);
    formData.append("phone", createOfficeData.phone);
    formData.append("email", createOfficeData.email);
    apiCreateOffice(formData, user?.companyId).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalShow(false);
        setCreateOfficeData({
          name: "",
          address: "",
          phone: "",
          email: "",
        });
        refetch();
      }
    });
  };

  //! поиск по всем полям
  useEffect(() => {
    if (shearchParam.trim() !== "") {
      const filteredData = originalData.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(shearchParam.toLowerCase())
        )
      );
      setTableData(filteredData);
    } else {
      setTableData([...originalData]); // Сбрасываем фильтр
    }
  }, [shearchParam, originalData]);

  //! при клике в контекстном меню
  const funParamClick = (param) => {
    console.log("param", param);
    if (param.key === "edit") {
      setModalEditShow(true);
      setModalEditData(param.row);
    }
    if (param.key === "delete") {
      funDeleteOffice(param.row.id);
    }
  };

  //! обновление офиса
  const funUpdateOffice = () => {
    apiUpdateOffice(modalEditData, modalEditData.id).then((res) => {
      if (res.status === 200) {
        setModalEditShow(false);
        refetch();
      }
    });
  };

  //! удаление офиса
  const funDeleteOffice = (id) => {
    apiDeleteOffice(id).then((res) => {
      if (res.status === 200) {
        refetch();
      }
    });
  };

  return (
    <div className={styles.Offices}>
      <h1>Офисы</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить офис"}
        inputs={addOfficeData}
        data={createOfficeData}
        setData={setCreateOfficeData}
        funSave={funCreateOffice}
      />
      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать данные офиса"}
        inputs={addOfficeData}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funUpdateOffice}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
      />
      <div className={styles.content}>
        <Table
          prewData={[]}
          tableData={tableData}
          setTableData={setTableData}
          direction={[]}
          setModalShow={setModalShow}
          paramMenu={paramMenu}
          tableHeader={tableHeader}
          funClick={funParamClick}
        />
      </div>
    </div>
  );
}

export default Offices;
