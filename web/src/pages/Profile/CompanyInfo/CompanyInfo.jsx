import { useSelector } from "react-redux";
import Company from "../../Admin/Company/Company";
import styles from "./CompanyInfo.module.scss";
import { apiGetUsers } from "../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";

function CompanyInfo({ funUpdUser }) {
  const user = useSelector((state) => state.user.user.data);
  const office = useSelector((state) => state.user.user.data?.office);
  const floor = useSelector((state) => state.user.user.data?.floor);
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users/all", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });
  console.log("user", user);
  return (
    <div className={styles.CompanyInfo}>
      <Company funUpdUser={funUpdUser} noedit={true} />
      <div className={styles.ofice_floor}>
        <div className={styles.office}>
          <h2>Мой офис</h2>
          <div className={styles.office_info}>
            <div>
              <span>Название: {office?.name}</span>
              <span>Адрес: {office?.address}</span>
              <span>Телефон: {office?.phone}</span>
              <span>Тип: {office?.typeOwnership}</span>
              <span>
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
        <div className={styles.office}>
          <h2>Мой этаж</h2>
          <div className={styles.office_info}>
            <div>
              <span>Название: {floor?.name}</span>
              <span>Номер: {floor?.number}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyInfo;
