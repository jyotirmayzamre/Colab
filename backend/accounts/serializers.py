from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .utils import validate_email as check_valid_email
from .models import User
from typing import cast

'''
Read-only serializer for returning user to frontend
'''
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'site_id', 'first_name', 'last_name', 'username', 'email'] 


class UserProfileSerializer(serializers.ModelSerializer):
    documents_owned = serializers.IntegerField()
    documents_shared = serializers.IntegerField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'username', 'email', 'documents_owned', 'documents_shared']
        read_only_fields = ['id', 'email']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

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
        user = authenticate(
            username=data['username'], 
            password=data['password']
            )
        
        if user is None:
            raise ValidationError('Incorrect credentials')
        
        token = cast(RefreshToken, MyTokenObtainPairSerializer.get_token(user))
        return {
            'access': str(token.access_token),
            'refresh': str(token)
        }
        
        
        
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['site_id'] = user.site_id
        return token
    

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('access')
        if token is None:
            return None
        
        validated_token = self.get_validated_token(token)
        return self.get_user(validated_token), validated_token
    


class UpdatePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "New passwords do not match."
            })
        return data


class UpdateUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    
    def validate_username(self, value: str):
        user = self.context.get('user')
        
        if user and user.username == value:
            raise serializers.ValidationError("This is already your username.")
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        
        return value
