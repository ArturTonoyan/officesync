import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/app.scss";
import Authorization from "./pages/entrance/Authorization/Authorization";
import Registration from "./pages/entrance/Registration/Registration";
import AboutUs from "./pages/AboutUs/AboutUs";
import Admin from "./pages/Admin/Admin";
import Company from "./pages/Admin/Company/Company";
import Offices from "./pages/Admin/Offices/Offices";
import Floors from "./pages/Admin/Floors/Floors";
import Users from "./pages/Admin/Users/Users";
import Equipments from "./pages/Admin/Equipments/Equipments";
import Problems from "./pages/Admin/Problems/Problems";
import To from "./pages/Admin/To/To";
import Constructor from "./pages/Constructor/Constructor";
import { apiGetUser } from "./api/apirequests";
import { useEffect } from "react";
import { setUserData } from "./store/userSlice/user.Slice";
import Profile from "./pages/Profile/Profile";
import CompanyInfo from "./pages/Profile/CompanyInfo/CompanyInfo";

function App() {
  const queryClient = new QueryClient();
  const dispatch = useDispatch();
  const userRole = useSelector(
    (state) => state.user.user.data?.roles?.[0]?.value
  );

  const funUpdUser = () => {
    apiGetUser().then((res) => {
      dispatch(setUserData({ data: res.data }));
    });
  };

  useEffect(() => {
    funUpdUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main>
          <Routes>
            <Route
              path="/authorization"
              element={<Authorization funUpdUser={funUpdUser} />}
            ></Route>
            <Route
              path="/registration"
              element={<Registration funUpdUser={funUpdUser} />}
            ></Route>
            <Route path="/" element={<AboutUs />}></Route>
            {userRole === "ADMIN" && (
              <>
                <Route path="/admin" element={<Admin />}>
                  <Route
                    path=""
                    element={<Company funUpdUser={funUpdUser} />}
                  ></Route>
                  <Route path="offices" element={<Offices />}></Route>
                  <Route path="floors" element={<Floors />}></Route>
                  <Route path="users" element={<Users />}></Route>
                  <Route path="equipments" element={<Equipments />}></Route>
                  <Route path="problems" element={<Problems />}></Route>
                  <Route path="to" element={<To />}></Route>
                </Route>
                <Route path="/constructor" element={<Constructor />}></Route>
                <Route path="/profile" element={<Profile />}>
                  <Route
                    path=""
                    element={<CompanyInfo funUpdUser={funUpdUser} />}
                  ></Route>
                </Route>
              </>
            )}
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
