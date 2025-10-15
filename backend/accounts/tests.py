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

    

    def test_logout(self):
        login_response = self.client.post('/api/accounts/login/', {
            'username': 'testuser',
            'password': 'password123'
        }, format='json')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data["access"]}') # type: ignore

        logout_response = self.client.post('/api/accounts/logout/', {
            'refresh': login_response.data['refresh'] # type: ignore
        }, format='json')

        
        self.assertEqual(logout_response.data['message'], 'Logout successful') # type: ignore
        
        invalid_response = self.client.post('/api/accounts/logout/', {
            'refresh': login_response.data['refresh'] # type: ignore
        })
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
    

    def test_token_refresh(self):
        login_response = self.client.post('/api/accounts/login/', {
            'username': 'testuser',
            'password': 'password123'
        }, format='json')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data["access"]}') # type: ignore

        refresh_response = self.client.post('/api/accounts/token/refresh/', {
            'refresh': login_response.data['refresh'] # type: ignore
        })
        self.assertIn('access', refresh_response.data) # type: ignore
        self.assertIn('refresh', refresh_response.data) # type: ignore

        self.client.post('/api/accounts/logout/', {
            'refresh': login_response.data['refresh'] # type: ignore
        }, format='json')


        invalid_response = self.client.post('/api/accounts/token/refresh/', {
            'refresh': login_response.data['refresh'] # type: ignore
        })

        self.assertEqual(invalid_response.status_code, status.HTTP_401_UNAUTHORIZED)

        

    