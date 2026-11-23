import { useAppSelector } from "@store/hooks";
import { nav } from "./data";
import logo from "@assets/images/logo/logo.svg";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui";

function Header() {
  const userEmail = useAppSelector((state) => state.user.user.data?.email);
  const isAdmin = useAppSelector((state) =>
    state.user.user.data?.roles?.some((role) => role.value === "ADMIN"),
  );

  const navigate = useNavigate();
  return (
    <header className="fixed left-0 top-0 z-50 box-border flex h-[72px] w-full flex-row items-center justify-between border-b border-transparent bg-[rgba(246,246,246,0.85)] px-10 py-5 backdrop-blur-[12px] transition-[border-color]">
      <div onClick={() => navigate("/")} className="cursor-pointer">
        <img src={logo} alt="OfficeSync" className="h-7 w-auto cursor-pointer" />
      </div>
      <nav className="flex flex-1 flex-row items-center justify-end gap-9 px-10">
        {nav.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className="text-sm font-medium text-fg-secondary no-underline transition-colors hover:text-fg"
          >
            {item.name}
          </a>
        ))}
        {isAdmin && (
          <a
            key="admin"
            href="/admin"
            className="text-sm font-medium text-fg-secondary no-underline transition-colors hover:text-fg"
          >
            Админ-панель
          </a>
        )}
      </nav>
      <div className="flex w-auto justify-end">
        <Button
          className="h-10 whitespace-nowrap px-[18px]"
          onClick={() => {
            userEmail ? navigate("/profile") : navigate("/authorization");
          }}
        >
          {userEmail ? "Личный кабинет" : "Войти"}
        </Button>
      </div>
    </header>
  );
}

export default Header;