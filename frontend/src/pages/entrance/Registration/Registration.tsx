import { useState } from "react";
import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import { inputs } from "./data";
import { apiRegister } from "../../../api/apirequests";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui";
import { Input } from "@components/ui";
import { cn } from "@utils/cn";

function Registration({ funUpdUser }) {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    surname: "",
    patronymic: "",
    email: "",
    role: "USER",
    password: "",
    repeatPassword: "",
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    apiRegister(data).then((res) => {
      if (res.status === 201) {
        navigate("/");
        funUpdUser();
      }
    });
  };

  return (
    <div className="min-h-screen bg-bg bg-[radial-gradient(ellipse_70%_50%_at_10%_0%,rgba(232,246,238,0.55),transparent_55%),radial-gradient(ellipse_60%_40%_at_95%_10%,rgba(240,234,248,0.45),transparent_50%)]">
      <HeadLogo />
      <div className="mt-6 w-full">
        <h1 className="text-center text-[28px] font-bold tracking-[-0.02em] text-fg">
          Регистрация
        </h1>
        <div className="mt-[15px] flex flex-row items-center justify-center">
          <span className="mr-2.5 text-sm font-normal text-[#989898]">
            Есть аккаунт?
          </span>
          <a className="text-ink" href="/authorization">
            Войти
          </a>
        </div>
        <div className="mx-auto flex w-[470px] flex-col items-center pt-[30px]">
          {inputs.map((item, index) => (
            <div key={item.key} className="mb-5 w-full" name={item.key}>
              {item.key === "role" ? (
                <div className="flex flex-row overflow-hidden rounded-md bg-bg2">
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(
                      "w-1/2 rounded-none border-0",
                      data.role === "ADMIN" && "bg-ink text-white hover:bg-ink-hover",
                    )}
                    onClick={() => funSetData("role", "ADMIN")}
                  >
                    Администратор
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(
                      "w-1/2 rounded-none border-0",
                      data.role === "USER" && "bg-ink text-white hover:bg-ink-hover",
                    )}
                    onClick={() => funSetData("role", "USER")}
                  >
                    Сотрудник
                  </Button>
                </div>
              ) : (
                <Input
                  key={index}
                  type={item.type}
                  placeholder={item.name}
                  autoComplete="new-password"
                  value={data[item.key]}
                  onChange={(e) => funSetData(item.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <Button className="mt-2 w-full" onClick={funSave}>
            Зарегистрироваться
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Registration;