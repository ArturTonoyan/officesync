import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/app.scss";
import Authorization from "./pages/entrance/Authorization/Authorization";
import Registration from "./pages/entrance/Registration/Registration";
import store from "./store/store";
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

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Provider store={store}>
          <main>
            <Routes>
              <Route path="/authorization" element={<Authorization />}></Route>
              <Route path="/registration" element={<Registration />}></Route>
              <Route path="/" element={<AboutUs />}></Route>
              <Route path="/admin*" element={<Admin />}>
                <Route path="" element={<Company />}></Route>
                <Route path="offices" element={<Offices />}></Route>
                <Route path="floors" element={<Floors />}></Route>
                <Route path="users" element={<Users />}></Route>
                <Route path="equipments" element={<Equipments />}></Route>
                <Route path="problems" element={<Problems />}></Route>
                <Route path="to" element={<To />}></Route>
              </Route>
              <Route path="/constructor" element={<Constructor />}></Route>
            </Routes>
          </main>
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
