import { useEffect, useState } from "react";
import { addFloorData, paramMenu, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import {
  apiCreateFloor,
  apiDeleteFloor,
  apiGetFloors,
  apiGetOffices,
  apiUpdateFloor,
  server,
} from "../../../api/apirequests";
import { buildPlanPreviewUrl } from "../../Constructor/floorplan/planPreview";
import { useAppSelector } from "@store/hooks";
import { useQuery } from "@tanstack/react-query";

function Floors() {
  const user = useAppSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});
  const [createFloorData, setCreateFloorData] = useState({
    name: "",
    number: "",
    officeId: "",
  });

  const {
    status,
    data: offices,
    error,
    refetch,
  } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["floors/all/id", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (!Array.isArray(floors?.data)) return;

    const qdat = floors.data.map((item) => ({
      id: item.id,
      name: item.name || "",
      number: item.number ?? "",
      officeId: item.officeId || "",
      office: offices?.data?.find((el) => el.id === item.officeId)?.name || "",
      users: item.users?.length || 0,
      devices: item.eqipments?.length || 0,
      image: item.image
        ? `${server}/${item.image}`
        : buildPlanPreviewUrl(item.planData) || "",
    }));
    setTableData(qdat);
    setOriginalData(qdat);
  }, [floors?.data, offices?.data]);

  //! поиск по всем полям
  useEffect(() => {
    if (shearchParam.trim() !== "") {
      const filteredData = originalData.filter((item) =>
        Object.values(item).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(shearchParam.toLowerCase()),
        ),
      );
      setTableData(filteredData);
    } else {
      setTableData([...originalData]);
    }
  }, [shearchParam, originalData]);

  //! функция создания этажа
  const funCreateFloor = () => {
    const formdata = {
      name: createFloorData.name,
      number: Number(createFloorData.number),
      officeId: createFloorData.officeId,
    };
    apiCreateFloor(formdata).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setModalShow(false);
        setCreateFloorData({
          name: "",
          number: "",
          officeId: "",
        });
        refetchFloors();
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
      funDeleteFloor(param.row.id);
    }
  };

  //! обновление этажа
  const funUpdateFloor = () => {
    apiUpdateFloor(
      { name: modalEditData.name, number: modalEditData.number },
      modalEditData.id
    ).then((res) => {
      if (res.status === 200) {
        setModalEditShow(false);
        refetchFloors();
      }
    });
  };

  //! удаление этажа
  const funDeleteFloor = (id) => {
    apiDeleteFloor(id).then((res) => {
      if (res.status === 200) {
        refetchFloors();
      }
    });
  };

  return (
    <div>
      <h1>Этажи</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить этаж"}
        inputs={addFloorData}
        lists={{
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name", "address"],
          },
        }}
        data={createFloorData}
        setData={setCreateFloorData}
        funSave={funCreateFloor}
      />
      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать данные этажа"}
        inputs={addFloorData}
        lists={{
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name", "address"],
          },
        }}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funUpdateFloor}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
        tableData={tableData}
        tableHeader={tableHeader}
      />
      <div className="mt-5 w-full min-w-0 box-border overflow-x-auto">
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

export default Floors;
