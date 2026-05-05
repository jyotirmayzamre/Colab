from permissions.services import PermissionService
from .models import Permission, ShareLink
from rest_framework import serializers

"""
Document Access Serializers
"""


from rest_framework import serializers
from .models import Permission


class PermissionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    user_id = serializers.IntegerField(write_only=True, required=False)
    document_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Permission
        fields = [
            "id",
            "user",
            "user_id",
            "username",
            "email",
            "document",
            "document_id",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "document",
            "username",
            "email",
            "created_at",
            "updated_at",
        ]

    def validate_role(self, value):
        if value == "owner":
            raise serializers.ValidationError("Owner role cannot be assigned")
        return value

    def validate(self, attrs):
        if self.instance is None:
            if "user_id" not in attrs or "document_id" not in attrs:
                raise serializers.ValidationError(
                    "user_id and document_id are required"
                )
        return attrs


class ShareLinkSerializer(serializers.ModelSerializer):
    document_id = serializers.IntegerField()
    link = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = ShareLink
        fields = ["document_id", "role", "link", "expires_at", "is_expired"]
        read_only_fields = ["document_id", "expires_at", "link", "is_expired"]

    def get_link(self, obj):
        request = self.context.get("request")
        base_url = request.build_absolute_uri("/").rstrip("/") if request else ""
        return f"{base_url}/shareLink/{obj.token}?role={obj.role}"

    def get_is_expired(self, obj):
        return obj.is_expired()


class ShareLinkAcceptSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        if not ShareLink.objects.filter(token=value).exists():
            raise serializers.ValidationError("Invalid share link token")
        return value
