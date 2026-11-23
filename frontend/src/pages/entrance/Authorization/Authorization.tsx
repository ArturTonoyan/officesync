import { useNavigate } from "react-router-dom";
import { apiLogin } from "../../../api/apirequests";
import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import { inputs } from "./data";
import { useState } from "react";
import { Button } from "@components/ui";
import { Input } from "@components/ui";

function Authorization({ funUpdUser }) {
  const navigate = useNavigate();

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    apiLogin(data).then((res) => {
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
          Авторизация
        </h1>
        <div className="mt-[15px] flex flex-row items-center justify-center">
          <span className="mr-2.5 text-sm font-normal text-[#989898]">
            Еще не зарегистрированы?
          </span>
          <a className="text-ink" href="/registration">
            Регистрация
          </a>
        </div>
        <div className="mx-auto flex w-[470px] flex-col items-center pt-[30px]">
          {inputs.map((item, index) => (
            <div key={item.key} className="mb-5 w-full" name={item.key}>
              <Input
                type={item.type}
                placeholder={item.name}
                autoComplete="new-password"
                value={data[item.key]}
                onChange={(e) => funSetData(item.key, e.target.value)}
              />
            </div>
          ))}
          <Button className="mt-2 w-full" onClick={funSave}>
            Войти
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Authorization;