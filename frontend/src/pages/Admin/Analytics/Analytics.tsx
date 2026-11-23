import { useQuery } from "@tanstack/react-query";
import {
  apiGetEquipments,
  apiGetFloors,
  apiGetOffices,
  apiGetProblems,
  apiGetReserveds,
  apiGetTos,
  apiGetUsers,
} from "../../../api/apirequests";
import { useAppSelector } from "@store/hooks";
import OfficeEquipmentChart from "./Components/ReactECharts/OfficeEquipmentChart";
import EquipmentWarrantyChart from "./Components/EquipmentWarrantyChart/EquipmentWarrantyChart";
import OfficeChart from "./Components/OfficeChart/OfficeChart";
import DonutChart from "./Components/DonutChart/DonutChart";
import EquipmentProblems3DChart from "./Components/EquipmentProblems3DChart/EquipmentProblems3DChart";
import AnalyticsChart from "./Components/AnalyticsChart/AnalyticsChart";

function Analytics() {
  const user = useAppSelector((state) => state.user.user.data);

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: reserveds } = useQuery({
    queryKey: ["problems/all/id"],
    queryFn: () => apiGetReserveds("", ""),
    staleTime: Infinity, //! не обновлять
  });

  const { data: equipments, refetch: refetchEquipments } = useQuery({
    queryKey: ["equipments/all/id", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["floors", user?.companyId],
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

  return (
    <div>
      <h1>Аналитика</h1>
      <div className="mt-5 w-full min-w-0 box-border overflow-x-auto p-0">
        <div className="mb-10">
          <h2 className="mb-10">Офисы</h2>
          {offices?.data && <OfficeEquipmentChart data={offices?.data} />}
          <br />
          {offices?.data && <OfficeChart offices={offices?.data} />}
        </div>
        <div className="mb-10">
          <h2 className="mb-10">Этажи</h2>
          {floors?.data && <EquipmentWarrantyChart floors={floors?.data} />}
        </div>
        <div className="mb-10">
          <h2 className="mb-10">Бронирования</h2>
          {reserveds?.data && <AnalyticsChart usageData={reserveds?.data} />}
        </div>
        <div className="mb-10">
          <h2 className="mb-10">Сотрудники</h2>
          {users?.data && <DonutChart users={users?.data} />}
        </div>
        <div className="mb-10">
          <h2 className="mb-10">Оборудование</h2>
          {equipments?.data && (
            <EquipmentProblems3DChart equipment={equipments?.data} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;