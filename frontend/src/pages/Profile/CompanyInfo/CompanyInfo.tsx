import { useAppSelector } from "@store/hooks";
import Company from "../../Admin/Company/Company";
import { apiGetUsers } from "../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";

function CompanyInfo({ funUpdUser }) {
  const user = useAppSelector((state) => state.user.user.data);
  const office = useAppSelector((state) => state.user.user.data?.office);
  const floor = useAppSelector((state) => state.user.user.data?.floor);
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users/all", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });
  console.log("user", user);
  return (
    <div className="mb-[100px]">
      <Company funUpdUser={funUpdUser} noedit={false} />
      <div className="flex flex-row">
        <div className="mr-10">
          <h2 className="mt-10 text-[28px]">Мой офис</h2>
          <div className="mt-10 box-border flex h-max w-max flex-col items-start p-[60px]">
            <div>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Название: {office?.name}
              </span>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Адрес: {office?.address}
              </span>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Телефон: {office?.phone}
              </span>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Тип: {office?.typeOwnership}
              </span>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Директор:{" "}
                {
                  users?.data?.find((item) => item.id === office?.directorId)
                    ?.surname
                }{" "}
                {
                  users?.data?.find((item) => item.id === office?.directorId)
                    ?.name
                }{" "}
                {
                  users?.data?.find((item) => item.id === office?.directorId)
                    ?.patronymic
                }
              </span>
            </div>
          </div>
        </div>
        <div className="mr-10">
          <h2 className="mt-10 text-[28px]">Мой этаж</h2>
          <div className="mt-10 box-border flex h-max w-max flex-col items-start p-[60px]">
            <div>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Название: {floor?.name}
              </span>
              <span className="flex pb-[18px] text-lg font-medium text-fg">
                Номер: {floor?.number}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyInfo;