import { createBrowserRouter } from "react-router-dom";
import AuthPage from "./AuthPage/AuthPage";
import LoginForm from "./AuthPage/LoginForm";
import RegisterForm from "./AuthPage/RegisterForm";
import ProtectedRoute from "./Auth/ProtectedRoute";
import Dashboard from "./Dashboard/Dashboard";
import EditorPage from "./Editor/EditorPage";
import Landing from "./landing";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
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