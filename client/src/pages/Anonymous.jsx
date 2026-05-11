import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";

const Anonymous = () => {
  return (
    <div className="container text-center justify-center align-middle mt-20">
      <h1 className="text-6xl">404</h1>
      <br></br>
      <h1>Page Not Found </h1>
      <br></br>
      <Link component={RouterLink} to="/" underline="hover">
        Back to home
      </Link>
    </div>
  );
};

export default Anonymous;