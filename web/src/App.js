import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Provider store={store}>
          <main>
            <Routes>
              <Route path="Authorization" element={<Authorization />}></Route>
            </Routes>
          </main>
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
