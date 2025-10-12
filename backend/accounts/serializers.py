from .models import User
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from .utils import validate_email as check_valid_email
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

'''
Read-only serializer for returning user to frontend
'''
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email'] 


'''
Serializer for registering a user
'''
class RegisterSerializer(serializers.ModelSerializer[User]):
    password = serializers.CharField(min_length=8, write_only=True)
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'username',
            'password',
            'email'
        ]
    
    def validate_email(self, value: str):
        valid, message = check_valid_email(value)

        if not valid:
            raise serializers.ValidationError(message)
        try:
            name, domain = value.strip().rsplit('@', 1)
        except ValueError:
            pass
        else:
            value = '@'.join([name, domain.lower()])

        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return UserSerializer(user).data
    

'''
Serializer for logging a user in
'''

class LoginSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=8, write_only=True)
    username = serializers.CharField()

    
    def validate(self, data):
        username = data.get('username', None)
        password = data.get('password', None)

        if username is None:
            raise ValidationError('Username is required')
    
        if password is None:
            raise ValidationError('Password is required')
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            raise ValidationError('Incorrect credentials')
        
        token_serializer = TokenObtainPairSerializer(data={'username': username, 'password': password})
        token_serializer.is_valid(raise_exception=True)
        tokens = token_serializer.validated_data
        
        user_data = dict(UserSerializer(user).data)
        return {
            'access': tokens['access'], #type: ignore
            'refresh': tokens['refresh'], #type: ignore
            **user_data
        }

        
        

