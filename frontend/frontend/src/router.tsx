import { createBrowserRouter } from "react-router-dom";
import AuthPage from "./AuthPage/AuthPage";
import LoginForm from "./AuthPage/LoginForm";
import RegisterForm from "./AuthPage/RegisterForm";
import ProtectedRoute from "./Auth/ProtectedRoute";
import Dashboard from "./Home/Dashboard";
import EditorPage from "./Editor/EditorPage";

const router = createBrowserRouter([
  {
    path: "auth",
    element: <AuthPage />,
    children: [
      { path: "register", element: <RegisterForm /> },
      { path: "login", element: <LoginForm /> },
    ],
  },
  {
    path: 'home/:userId',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: 'document/:docId',
    element: <ProtectedRoute><EditorPage /></ProtectedRoute>
  }
]);

export default router;