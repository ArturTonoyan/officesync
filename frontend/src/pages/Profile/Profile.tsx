import { Outlet } from "react-router-dom";
import LeftMenu from "./LeftMenu/LeftMenu";

function Profile({ funUpdUser }) {
  return (
    <div className="flex min-h-screen flex-row bg-bg">
      <LeftMenu funUpdUser={funUpdUser} />
      <div className="box-border w-full pb-12 pl-[calc(var(--spacing-sidebar)+32px)] pr-8 pt-7 [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:tracking-[-0.03em] [&_h1]:text-fg">
        <Outlet />
      </div>
    </div>
  );
}

export default Profile;