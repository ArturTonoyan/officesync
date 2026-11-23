import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo/logo.svg";

function HeadLogo() {
  const navigate = useNavigate();
  return (
    <div className="p-10">
      <img
        src={logo}
        className="h-[33px] w-[187px] cursor-pointer"
        alt="logo"
        onClick={() => navigate("/")}
      />
    </div>
  );
}

export default HeadLogo;