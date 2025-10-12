import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthPage from "./Pages/AuthPage";
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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