from .models import User
from rest_framework import serializers
from django.core.exceptions import ValidationError
import utils

'''
Read-only serializer for returning user to frontend
'''
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email', 'is_active', 'created', 'updated'] 
        read_only_fields = ['is_active', 'created', 'updated']


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
        valid, message = utils.validate_email(value)

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
        return user