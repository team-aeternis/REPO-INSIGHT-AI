import { useState } from "react";

import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import Hero from "../components/Hero";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/auth/authThunk";
import { verify } from "../services/authService";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [credentials, setCredentials] = useState(true);

  const [otp, setOtp] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("All details required");
      setFormData({ email: "", password: "" });
      return;
    }

    try {
      const res = await dispatch(loginUser(formData)).unwrap();
      console.log(res);

      if (res?.success) {
        navigate("/welcome");
        toast.success("Login successful");
      } else {
        toast.error(res?.message);
      }

      setFormData({ email: "", password: "" });
    } catch (err) {
      if (err?.data === false) {
        setCredentials(false);
        toast.error(err?.message);
        return;
      }

      toast.error(err?.message || "Invalid email or password");
      setFormData({ email: "", password: "" });
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();

    try {
      let response = await verify({
        email: formData.email,
        otp: otp,
        purpose: "LOGIN",
      });
      if (response.success) {
        toast.success(response.message);
        setFormData({ email: "", password: "" });
        setOtp("");
        setCredentials(true);
        const res = await dispatch(loginUser(formData)).unwrap();
        navigate("/welcome");
      } else {
        console.log(response);
        toast.error(response.message);
      }
    } catch (error) {
      
      toast.error(error.response.data.message);
    }
  };

  return (
    <>
      <div className="container w-full">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f1f5f9",
            gap: 4,
            px: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "#f1f5f9",
              boxShadow: "none",
              border: "none",
              width: { xs: "90%", sm: 500 },
              p: { xs: 2, sm: 4 },
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" fontWeight={600}>
              Sign In
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/auth/signup" underline="hover">
                Sign up
              </Link>
            </Typography>

            <Box
              noValidate
              component="form"
              onSubmit={credentials ? handleSubmit : handleVerification}
              sx={{ mt: 3 }}
            >
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                margin="normal"
                required
                value={formData.email}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                margin="normal"
                required
                value={formData.password}
                onChange={handleChange}
              />

              {credentials ? (
                ""
              ) : (
                <TextField
                  fullWidth
                  label="otp"
                  name="otp"
                  type="otp"
                  margin="normal"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <FormControlLabel control={<Checkbox />} label="Remember me" />

                <Link
                  component={RouterLink}
                  to="/forgot"
                  underline="hover"
                  variant="body2"
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
              >
                {credentials ? <h1>Sign In</h1> : <h1>Verify</h1>}
              </Button>
            </Box>
          </Paper>
          <Hero />
        </Box>
      </div>
    </>
  );
}

export default LoginPage;