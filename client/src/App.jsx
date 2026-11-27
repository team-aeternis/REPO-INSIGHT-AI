import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Anonymous from "./pages/Anonymous";
import WelcomePage from "./pages/WelcomePage";
import { ToastContainer } from "react-toastify";
import ExplorePage from "./pages/ExplorePage";
import AdminPage from "./pages/AdminPage";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "./redux/auth/authThunk";
import TermsAcceptanceGate from "./components/TermsAcceptanceGate";

function RequireAuth({ children }) {
  const { user, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your session...</div>;
  }
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your session…</div>;
  }
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  if (user.role !== "admin") return <Navigate to="/welcome" replace />;
  return children;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => {
    return state.auth.user;
  });

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>}>
            <Route index element={<Navigate to="/auth/login" replace />} />
            <Route path="dashboard" element={<WelcomePage username={user?.name} />} />
            <Route
              path="welcome"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="explore"
              element={
                <TermsAcceptanceGate>
                  <ExplorePage />
                </TermsAcceptanceGate>
              }
            />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
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
