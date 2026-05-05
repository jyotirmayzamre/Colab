from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class BaseTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="StrongPass123!",
            first_name="Test",
            last_name="User",
        )

    def authenticate(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "testuser",
                "password": "StrongPass123!",
            },
        )
        self.client.cookies = response.COOKIES


class RegistrationViewTest(BaseTestCase):
    url = reverse("register")

    def test_register_success(self):
        data = {
            "username": "newuser",
            "email": "new@test.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_password_mismatch(self):
        data = {
            "username": "newuser",
            "email": "new@test.com",
            "password": "StrongPass123!",
            "password2": "WrongPass123!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        data = {
            "username": "testuser",
            "email": "other@test.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTest(BaseTestCase):
    url = reverse("login")

    def test_login_success_sets_cookies(self):
        response = self.client.post(
            self.url,
            {
                "username": "testuser",
                "password": "StrongPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.COOKIES)
        self.assertIn("refresh", response.COOKIES)
        self.assertTrue(response.cookies["access"]["httponly"])
        self.assertTrue(response.cookies["refresh"]["httponly"])

    def test_login_does_not_expose_tokens_in_body(self):
        response = self.client.post(
            self.url,
            {
                "username": "testuser",
                "password": "StrongPass123!",
            },
        )
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_login_wrong_password(self):
        response = self.client.post(
            self.url,
            {
                "username": "testuser",
                "password": "wrongpassword",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutViewTest(BaseTestCase):
    def test_logout_clears_cookies(self):
        self.authenticate()
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Django sets cookie to empty string + past expiry on delete
        self.assertEqual(response.COOKIES["access"].value, "")
        self.assertEqual(response.COOKIES["refresh"].value, "")

    def test_logout_blacklists_refresh_token(self):
        self.authenticate()
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.post(reverse("refresh_token"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_unauthenticated(self):
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenRefreshViewTest(BaseTestCase):
    def test_refresh_success(self):
        self.authenticate()
        response = self.client.post(reverse("refresh_token"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.COOKIES)
        self.assertEqual(response.data["detail"], "Token refreshed.")

    def test_refresh_missing_cookie(self):
        response = self.client.post(reverse("refresh_token"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordChangeViewTest(BaseTestCase):
    def test_password_change_success(self):
        self.authenticate()
        response = self.client.patch(
            reverse("update_password"),
            {
                "old_password": "StrongPass123!",
                "new_password": "NewStrongPass456!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPass456!"))

    def test_password_change_wrong_old_password(self):
        self.authenticate()
        response = self.client.patch(
            reverse("update_password"),
            {
                "old_password": "wrongpassword",
                "new_password": "NewStrongPass456!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UsernameChangeViewTest(BaseTestCase):
    def test_username_change_success(self):
        self.authenticate()
        response = self.client.patch(
            reverse("update_username"),
            {
                "username": "newusername",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "newusername")

    def test_username_change_taken(self):
        User.objects.create_user(
            username="taken", email="taken@test.com", password="pass"
        )
        self.authenticate()
        response = self.client.patch(
            reverse("update_username"),
            {
                "username": "taken",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
