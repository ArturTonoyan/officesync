import { useEffect, useState } from "react";
import styles from "./Users.module.scss";
import { addOfficeData, editOfficeData, paramMenu, tableHeader } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";
import {
  apiCreateUser,
  apiDeleteUser,
  apiGetFloors,
  apiGetOffices,
  apiGetRoles,
  apiGetUsers,
  apiUpdateUser,
  server,
} from "../../../api/apirequests";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";

function Users() {
  const user = useSelector((state) => state.user.user.data);
  const [originalData, setOriginalData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});

  const [createUserData, setCreateUserData] = useState({});

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
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users/all", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ["roles/all"],
    queryFn: () => apiGetRoles(),
    staleTime: Infinity, //! не обновлять
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["floors/all/id", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (users?.data) {
      const qdata = users?.data.map((item) => ({
        ...item,
        fio: `${item.surname} ${item.name} ${item.patronymic}`,
        role: item.roles?.map((role) => role.description).join(", "),
        office: offices?.data?.find((office) => office.id === item.officeId)
          ?.name,
        floor: item?.floor?.name,
        image: `${server}/${item.image}`,
      }));
      setTableData(qdata);
      setOriginalData(qdata);
    }
  }, [users?.data, offices]);

  //! удаление сотрудника
  const funDeleteUser = (id) => {
    apiDeleteUser(id).then((res) => {
      if (res.status === 200) {
        refetchUsers();
      }
    });
  };

  //! добавить сотрудника
  const funAddUser = () => {
    let data = {
      ...createUserData,
      companyId: user.companyId,
      role: roles?.data?.find(
        (role) => role.description === createUserData.roleId
      )?.value,
    };
    console.log("createUserData", createUserData);

    apiCreateUser(data).then((res) => {
      if (res.status === 201) {
        setModalShow(false);
        refetchUsers();
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
      funDeleteUser(param.row.id);
    }
  };

  //! обновление данных сотрудника
  const funUpdateUser = () => {
    apiUpdateUser(modalEditData, modalEditData.id).then((res) => {
      if (res.status === 200) {
        setModalEditShow(false);
        refetchUsers();
      }
    });
  };

  return (
    <div className={styles.Users}>
      <h1>Сотрудники</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить сотрудника"}
        inputs={addOfficeData}
        funSave={funAddUser}
        setData={setCreateUserData}
        data={createUserData}
        lists={{
          role: {
            data: roles?.data,
            key: "roleId",
            obj: { key: "role", value: "description" },
            value: ["description"],
          },
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name"],
          },
          floor: {
            data: floors?.data
              ?.filter((item) => item.office?.id === createUserData.officeId)
              .map((item) => ({
                ...item,
                officeName: item?.office?.name,
              })),
            key: "floorId",
            value: ["name", "officeName"],
          },
        }}
      />
      <ModalAddOfice
        show={modalEditShow}
        data={modalEditData}
        setShow={setModalEditShow}
        funSave={funUpdateUser}
        setData={setModalEditData}
        title={"Редактировать данные сотрудника"}
        inputs={editOfficeData}
        lists={{
          role: {
            data: roles?.data,
            key: "roleId",
            value: ["description"],
          },
          office: {
            data: offices?.data,
            key: "officeId",
            value: ["name"],
          },
          floor: {
            data: floors?.data
              ?.filter((item) => item.office?.id === modalEditData.officeId)
              .map((item) => ({
                ...item,

                officeName: item?.office?.name,
              })),
            key: "floorId",
            value: ["name", "officeName"],
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
          funClick={funParamClick}
          tableHeader={tableHeader}
        />
      </div>
    </div>
  );
}

export default Users;
