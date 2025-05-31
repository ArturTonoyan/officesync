import { use, useEffect, useState } from "react";
import styles from "./Problems.module.scss";
import { addOfficeData, paramMenu, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  apiCreateProblem,
  apiDeleteProblem,
  apiEditProblem,
  apiGetEquipments,
  apiGetProblems,
  apiPostNeural,
  server,
} from "../../../api/apirequests";

function Problems({ noedit }) {
  const user = useSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);

  const [createData, setCreateData] = useState({});
  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});

  const {
    data: problems,
    refetch: refetchProblems,
    isLoading: isLoadingProblems,
  } = useQuery({
    queryKey: ["problems/all/id", user?.companyId],
    queryFn: () => apiGetProblems(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: equipments, refetch: refetchEquipments } = useQuery({
    queryKey: ["equipments/all/id", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (problems?.data) {
      let qdat = [];

      if (noedit) {
        qdat = problems?.data
          ?.filter((item) => item.user?.id === user?.id)
          .map((item) => ({
            ...item,
            user:
              item?.status === "Автозаявка"
                ? "Нейросеть"
                : (item.user?.name || "") +
                  " " +
                  (item.user?.surname || "") +
                  " " +
                  (item.user?.patronymic || ""),
            equipment:
              item.equipment?.name + " " + item.equipment?.inventoryNumber,
            imageUrl: item?.image ? `${server}/${item?.image}` : null,
            toname: item?.to?.description,
          }));
      } else {
        qdat = problems?.data.map((item) => ({
          ...item,
          user:
            item?.status === "Автозаявка"
              ? "Нейросеть"
              : (item.user?.name || "") +
                " " +
                (item.user?.surname || "") +
                " " +
                (item.user?.patronymic || ""),
          equipment:
            item.equipment?.name + " " + item.equipment?.inventoryNumber,
          imageUrl: item?.image ? `${server}/${item?.image}` : null,
          toname: item?.to?.description,
        }));
      }
      setTableData(qdat);
      setOriginalData(qdat);
    }
  }, [problems?.data]);

  useEffect(() => {
    refetchProblems();
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
  const funCreateProblem = () => {
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
    apiCreateProblem(formData).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalShow(false);
        setCreateData({});
        refetchProblems();
      }
    });
  };

  const funEditProblem = () => {
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
    apiEditProblem(modalEditData.id, formData).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalEditShow(false);
        setModalEditData({});
        refetchProblems();
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

  //! удаление
  const funDelete = (id) => {
    apiDeleteProblem(id).then((res) => {
      if (res.status === 200) {
        refetchProblems();
      }
    });
  };

  useEffect(() => {
    if (!isLoadingProblems) {
      const futureDate = new Date();
      const selDat = new Date();
      selDat.setDate(selDat.getDate() + 7);
      futureDate.setDate(futureDate.getDate() + 100);
      const dataEq = equipments?.data?.map((item) => ({
        id: item?.id,
        currentOperatingTime: item?.currentWarranty,
        maximumOperatingTime: item?.maxWarranty,
        age: Number((item?.currentWarranty / 3000).toFixed(0)),
        numberTo: item?.to?.length,
      }));

      if (dataEq?.length > 0) {
        apiPostNeural(dataEq).then((res) => {
          if (res?.status === 200) {
            const newData = equipments?.data?.map((item, index) => {
              let wear = res?.data
                ?.find((el) => el.id === item?.id)
                ?.wear.toFixed(0);
              if (
                wear > 80 &&
                !problems?.data?.find((el) => el.equipmentId === item?.id)
              ) {
                const formData = new FormData();
                const fields = {
                  equipmentId: item?.id,
                  status: "Автозаявка",
                  urgency: "Срочно",
                  description:
                    "Критический износ оборудования " +
                    (wear - 10) +
                    "%, необходимо провести техническое обслуживание!",
                  companyId: user?.companyId,
                };
                Object.entries(fields).forEach(([key, value]) => {
                  if (value !== undefined && value !== null) {
                    formData.append(key, value);
                  }
                });
                apiCreateProblem(formData).then((res) => {
                  console.log("res", res);
                  if (res.status === 201) {
                    setModalShow(false);
                    setCreateData({});
                    refetchProblems();
                  }
                });
              }
            });
          }
          // setTableData(qdat);
          // setOriginalData(qdat);
        });
      }
    }
  }, [equipments]);

  return (
    <div className={styles.Problems}>
      <h1>Заявки на ремонт</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить неполадку"}
        inputs={addOfficeData}
        data={createData}
        setData={setCreateData}
        funSave={funCreateProblem}
        lists={{
          equipment: {
            data: equipments?.data,
            key: "equipmentId",
            value: ["name", "inventoryNumber"],
          },
        }}
      />

      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать неполадку"}
        inputs={addOfficeData}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funEditProblem}
        lists={{
          equipment: {
            data: equipments?.data,
            key: "equipmentId",
            value: ["name", "inventoryNumber"],
          },
        }}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
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

export default Problems;
