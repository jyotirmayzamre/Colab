import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthPage from "./Auth/AuthPage";
import LoginForm from "./AuthForms/LoginForm";
import RegisterForm from "./AuthForms/RegisterForm";
import ProtectedRoute from "./Auth/ProtectedRoute";
import HomePage from "./Home/HomePage";
import EditorPage from "./Editor/EditorPage";

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
  {
    path: 'home/:userId',
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
  },
  {
    path: 'document/:docId',
    element: <ProtectedRoute><EditorPage /></ProtectedRoute>
  }
]);

export default router;