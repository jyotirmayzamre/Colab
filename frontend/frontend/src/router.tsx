import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthPage from "./Pages/AuthPage";
import LoginForm from "./Components/Forms/LoginForm";
import RegisterForm from "./Components/Forms/RegisterForm";
import ProtectedRoute from "./Auth/ProtectedRoute";
import HomePage from "./Pages/HomePage";
import EditorPage from "./Pages/EditorPage";

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