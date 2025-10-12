from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

'''
Endpoint for registration of users
'''
class RegistrationAPIView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        print(request.data)
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():

            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED) 
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)