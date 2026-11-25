import { AppBar, Toolbar, IconButton, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOutUser } from "../redux/auth/authThunk";
import { toast } from "react-toastify";

export default function Navbar({ open, setOpen }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await dispatch(logOutUser()).unwrap();
      toast.success("You have signed out.");
      navigate("/auth/login");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Sign out failed.");
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="border-b border-slate-200"
      style={{ backgroundColor: "white", color: "#0f172a" }}
    >
      <Toolbar className="h-16 px-4 flex justify-between">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <IconButton onClick={() => setOpen(!open)}>
              <MenuIcon />
            </IconButton>
          </div>
          <div className="hidden md:block text-sm text-slate-500">
            Repository Intelligence Workspace
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
          <NavLink to="/dashboard" className="hover:text-slate-900">
            Overview
          </NavLink>
          <NavLink to="/explore" className="hover:text-slate-900">
            Explore
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <Button className="normal-case text-slate-700">
            <NavLink to="/explore" state={{ startNewChat: true }}>
              New Insight
            </NavLink>
          </Button>
          {user ? (
            <>
              <span className="hidden text-xs text-slate-500 sm:inline">
                {user.name}
              </span>
              <Button onClick={handleSignOut} className="normal-case text-slate-700">
                Sign out
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth/login")}
              startIcon={<AccountCircleIcon />}
              className="normal-case text-slate-700"
            >
              Sign in
            </Button>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}
