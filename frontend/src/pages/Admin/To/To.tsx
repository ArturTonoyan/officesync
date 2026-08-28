import { useEffect, useState } from "react";
import styles from "./To.module.scss";
import { addOfficeData, paramMenu, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import { useAppSelector } from "@store/hooks";
import { useQuery } from "@tanstack/react-query";
import {
  apiCreateTo,
  apiDeleteTo,
  apiEditTo,
  apiGetEquipments,
  apiGetProblems,
  apiGetTos,
  apiGetUsers,
  server,
} from "../../../api/apirequests";

function Tos({ noedit }) {
  const user = useAppSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);

  const [createData, setCreateData] = useState({});
  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});

  const { data: tos, refetch: refetchTos } = useQuery({
    queryKey: ["tos/all/id", user?.companyId],
    queryFn: () => apiGetTos(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: equipments, refetch: refetchEquipments } = useQuery({
    queryKey: ["equipments/all/id", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: problems, refetch: refetchProblems } = useQuery({
    queryKey: ["problems/all/id", user?.companyId],
    queryFn: () => apiGetProblems(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: users } = useQuery({
    queryKey: ["users/all/id", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (tos?.data) {
      let qdat = [];
      if (noedit) {
        qdat = tos?.data
          ?.filter((item) => item.user?.id === user?.id)
          .map((item) => ({
            ...item,
            user:
              item.user?.name +
              " " +
              item.user?.surname +
              " " +
              item.user?.patronymic,
            equipment:
              item.equipment?.name + " " + item.equipment?.inventoryNumber,
            image: item?.image ? `${server}/${item?.image}` : null,
            imageUrl: item?.image ? `${server}/${item?.image}` : null,
            problem: item.problem?.description,
            createdAt: item.createdAt.split("T")[0],
          }));
      } else {
        qdat = tos?.data.map((item) => ({
          ...item,
          user:
            item.user?.name +
            " " +
            item.user?.surname +
            " " +
            item.user?.patronymic,
          equipment:
            item.equipment?.name + " " + item.equipment?.inventoryNumber,
          image: item?.image ? `${server}/${item?.image}` : null,
          imageUrl: item?.image ? `${server}/${item?.image}` : null,
          problem: item.problem?.description,
          createdAt: item.createdAt.split("T")[0],
        }));
      }

      setTableData(qdat);
      setOriginalData(qdat);
    }
  }, [tos?.data]);

  useEffect(() => {
    refetchTos();
  }, []);

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

  //! создание неполадки
  const funCreateTo = () => {
    const formData = new FormData();
    const fields = {
      ...createData,
      companyId: user?.companyId,
      userId: user?.id,
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    apiCreateTo(formData).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalShow(false);
        setCreateData({});
        refetchTos();
      }
    });
  };

  const funEditTo = () => {
    const formData = new FormData();
    const fields = {
      ...modalEditData,
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    console.log("modalEditData", modalEditData);
    apiEditTo(modalEditData.id, formData).then((res) => {
      console.log("res", res);
      if (res.status === 200) {
        setModalEditShow(false);
        setModalEditData({});
        refetchTos();
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

  //! удаление офиса
  const funDelete = (id) => {
    apiDeleteTo(id).then((res) => {
      if (res.status === 200) {
        refetchTos();
      }
    });
  };

  return (
    <div className={styles.To}>
      <h1>Техническое обслуживание</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить ТО"}
        inputs={addOfficeData}
        data={createData}
        setData={setCreateData}
        funSave={funCreateTo}
        lists={{
          equipment: {
            data: equipments?.data,
            key: "equipmentId",
            value: ["name", "inventoryNumber"],
          },
          problem: {
            data: problems?.data,
            key: "problemId",
            value: ["description"],
          },
          user: {
            data: users?.data,
            key: "userId",
            value: ["name", "surname", "patronymic"],
          },
        }}
      />

      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать ТО"}
        inputs={addOfficeData}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funEditTo}
        lists={{
          equipment: {
            data: equipments?.data,
            key: "equipmentId",
            value: ["name", "inventoryNumber"],
          },
          problem: {
            data: problems?.data,
            key: "problemId",
            value: ["description"],
          },
          user: {
            data: users?.data,
            key: "userId",
            value: ["name", "surname", "patronymic"],
          },
        }}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
        noedit={noedit}
        tableData={tableData}
        tableHeader={tableHeader}
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

export default Tos;
