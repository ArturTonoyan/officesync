import { useEffect, useState } from "react";
import styles from "./Equipments.module.scss";
import { addOfficeData, paramMenu, paramMenuNoEdit, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  apiCreateEquipment,
  apiDeleteEquipment,
  apiGetEquipments,
  apiGetFloors,
  apiGetOffices,
  apiGetUsers,
  apiUpdateEquipment,
} from "../../../api/apirequests";

function Equipments({ noedit }) {
  const user = useSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);

  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});
  const [createData, setCreateData] = useState({
    name: "",
    inventoryNumber: "",
    type: "",
    description: "",
    cost: "",
    maxWarranty: "",
    currentWarranty: "",
    state: "",
    image: "",
    userId: "",
    floorId: "",
    officeId: "",
    companyId: "",
  });

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

  const { data: equipments, refetch: refetchEquipments } = useQuery({
    queryKey: ["equipments/all/id", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["offices", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users/all", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (equipments?.data) {
      let qdat = [];
      if (noedit) {
        qdat = equipments?.data
          ?.filter((el) => el.userId === user?.id)
          .map((item) => ({
            ...item,
            office: offices?.data?.find((el) => el.id === item.officeId)?.name,
            floor: floors?.data?.find((el) => el.id === item.floorId)?.name,
            user: users?.data?.find((el) => el.id === item.userId)?.name,
          }));
      } else {
        qdat = equipments?.data.map((item) => ({
          ...item,
          office: offices?.data?.find((el) => el.id === item.officeId)?.name,
          floor: floors?.data?.find((el) => el.id === item.floorId)?.name,
          user: users?.data?.find((el) => el.id === item.userId)?.name,
        }));
      }
      setTableData(qdat);
      setOriginalData(qdat);
    }
  }, [equipments?.data]);

  //! функция создания
  const funCreate = () => {
    const formData = new FormData();
    formData.append("name", createData.name);
    formData.append("inventoryNumber", createData.inventoryNumber);
    formData.append("type", createData.type);
    formData.append("description", createData.description);
    formData.append("cost", createData.cost);
    formData.append("maxWarranty", createData.maxWarranty);
    formData.append("currentWarranty", createData.currentWarranty);
    formData.append("state", createData.state);
    formData.append("image", createData.image);
    formData.append("userId", user?.id);
    formData.append("floorId", createData.floorId);
    formData.append("officeId", createData.officeId);
    formData.append("companyId", user?.companyId);
    apiCreateEquipment(formData).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalShow(false);
        setCreateData({});
        refetchEquipments();
      }
    });
  };

  //! при клике в контекстном меню
  const funParamClick = (param) => {
    console.log("param", param);
    if (param.key === "edit") {
      setModalEditShow(true);
      setModalEditData(param.row);
    }
    if (param.key === "delete") {
      funDelete(param.row.id);
    }
  };

  //! обновление оборудования
  const funUpdate = () => {
    apiUpdateEquipment(modalEditData, modalEditData.id).then((res) => {
      if (res.status === 200) {
        setModalEditShow(false);
        refetchEquipments();
      }
    });
  };

  //! удаление оборудования
  const funDelete = (id) => {
    apiDeleteEquipment(id).then((res) => {
      if (res.status === 200) {
        refetchEquipments();
      }
    });
  };

  return (
    <div className={styles.Equipments}>
      <h1> {noedit ? "Мои оборудование" : "Оборудование"} </h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить оборудование"}
        inputs={addOfficeData}
        data={createData}
        setData={setCreateData}
        funSave={funCreate}
        lists={{
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name", "address"],
          },
          floor: {
            data: floors?.data,
            key: "floorId",
            value: ["name", "address"],
          },
          user: {
            data: users?.data,
            key: "userId",
            value: ["name", "surname", "patronymic", "email"],
          },
        }}
      />
      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать данные оборудования"}
        inputs={addOfficeData}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funUpdate}
        lists={{
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name", "address"],
          },
          floor: {
            data: floors?.data,
            key: "floorId",
            value: ["name", "address"],
          },
          user: {
            data: users?.data,
            key: "userId",
            value: ["name", "surname", "patronymic", "email"],
          },
        }}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
        noedit={noedit}
      />
      <div className={styles.content}>
        <Table
          prewData={[]}
          tableData={tableData}
          setTableData={setTableData}
          direction={[]}
          setModalShow={setModalShow}
          paramMenu={!noedit ? paramMenu : paramMenuNoEdit}
          tableHeader={tableHeader}
          funClick={funParamClick}
        />
      </div>
    </div>
  );
}

export default Equipments;
