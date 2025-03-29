import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/app.scss";
import Authorization from "./pages/entrance/Authorization/Authorization";
import Registration from "./pages/entrance/Registration/Registration";
import store from "./store/store";

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
            </Routes>
          </main>
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
