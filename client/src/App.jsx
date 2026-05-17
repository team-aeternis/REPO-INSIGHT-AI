import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Anonymous from "./pages/Anonymous";
import WelcomePage from "./pages/WelcomePage";
import { ToastContainer } from "react-toastify";
import ExplorePage from "./pages/ExplorePage";
import AdminPage from "./pages/AdminPage";
import { useSelector } from "react-redux";

function App() {
  const user = useSelector((state) => {
    return state.auth.user;
  });

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />}>
            <Route index element={<WelcomePage username={user?.username} />} />
            <Route
              path="welcome"
              element={<WelcomePage username={user?.username} />}
            />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="/auth">
            <Route path="login" element={<LoginPage />}></Route>
            <Route path="signup" element={<SignupPage />}></Route>
          </Route>
          <Route path="*" element={<Anonymous />}></Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer
        className="w-2/5"
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
    </>
  );
}

export default App;
