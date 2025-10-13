from rest_framework.test import APIClient, APITestCase
from .models import User
from rest_framework import status

# Create your tests here.

class AuthTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123', email='test@test.com')
        self.client = APIClient()

    def test_login(self):
        response = self.client.post('/api/accounts/login/', {
            'username': 'testuser',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data) # type: ignore
        self.assertIn('refresh', response.data) # type: ignore