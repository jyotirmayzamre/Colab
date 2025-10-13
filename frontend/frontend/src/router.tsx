import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthPage from "./Pages/AuthPage";
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import ProtectedRoute from "./Auth/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><App /></ProtectedRoute>,
  },
  {
    path: "auth",
    element: <AuthPage />,
    children: [
      { path: "signup", element: <RegisterForm /> },
      { path: "login", element: <LoginForm /> },
    ],
  },
]);

export default router;