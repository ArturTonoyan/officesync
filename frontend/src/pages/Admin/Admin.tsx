import { Outlet } from "react-router-dom";
import LeftMenu from "./LeftMenu/LeftMenu";

function Admin() {
  return (
    <div className="flex min-h-screen bg-bg">
      <LeftMenu />
      <div className="box-border min-h-screen min-w-0 w-full max-w-full flex-1 overflow-x-auto bg-bg pl-[calc(248px+36px)] pr-9 pb-12 pt-7 [&>h1]:mb-1 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:tracking-[-0.03em] [&>h1]:text-fg">
        <Outlet />
      </div>
    </div>
  );
}

export default Admin;