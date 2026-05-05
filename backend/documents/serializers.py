from rest_framework import serializers
from .models import Document
from django.utils import timezone
from django.utils.timesince import timesince
from .services import DocumentService


class DocumentSerializer(serializers.ModelSerializer):
    permission = serializers.CharField(read_only=True)
    num_users = serializers.IntegerField(read_only=True)
    last_updated = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Document
        fields = ["id", "title", "permission", "num_users", "last_updated"]
        read_only_fields = ["id", "permission", "num_users", "last_updated"]

    def get_last_updated(self, obj):
        now = timezone.now()
        diff = timesince(obj.updated_at, now)
        return f"{diff.split(', ')[0]} ago"

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        return DocumentService.create_document(user, validated_data["title"])
