import { AppBar, Toolbar, IconButton, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { NavLink } from "react-router-dom";
export default function Navbar({ open, setOpen }) {
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
          <NavLink to="/welcome" className="hover:text-slate-900">
            Overview
          </NavLink>
          <NavLink to="/explore" className="hover:text-slate-900">
            Explore
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <Button className="normal-case text-slate-700">
            <NavLink to="/explore">
              New Insight
            </NavLink>
          </Button>
          <IconButton>
            <AccountCircleIcon />
          </IconButton>
        </div>
      </Toolbar>
    </AppBar>
  );
}
