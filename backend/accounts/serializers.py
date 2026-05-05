from .utils import validate_email as check_valid_email
from django.contrib.auth.password_validation import validate_password
from rest_framework.serializers import ModelSerializer, Serializer
from rest_framework.serializers import CharField, IntegerField, SerializerMethodField
from rest_framework.serializers import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class RegisterSerializer(ModelSerializer):
    password = CharField(write_only=True, validators=[validate_password])
    password2 = CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "password",
            "password2",
            "email",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise ValidationError({"password": "Passwords do not match"})

        # email
        value = attrs["email"]
        valid, message = check_valid_email(value)

        if not valid:
            raise ValidationError(message)
        try:
            name, domain = value.strip().rsplit("@", 1)
        except ValueError:
            pass
        else:
            value = "@".join([name, domain.lower()])
            attrs["email"] = value

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class UserSerializer(ModelSerializer):
    name = SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "username", "email"]
        read_only_fields = fields

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class UserProfileSerializer(UserSerializer):
    documents_owned = IntegerField(read_only=True)
    documents_shared = IntegerField(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["documents_shared", "documents_owned"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token


class PasswordChangeSerializer(Serializer):
    new_password = CharField(write_only=True)
    confirm_password = CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError('Passwords don"t match')

        return attrs

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.save()
        return instance


class UsernameChangeSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("username",)

    def validate_username(self, value):
        if User.objects.exclude(id=self.instance.id).filter(username=value).exists():
            raise ValidationError("Username already taken.")
        return value

    def update(self, instance, validated_data):
        instance.username = validated_data["username"]
        instance.save()
        return instance
