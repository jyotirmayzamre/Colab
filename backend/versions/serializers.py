from rest_framework import serializers
from .models import Version
from documents.models import Document


class VersionSerializer(serializers.ModelSerializer):
    document_id = serializers.PrimaryKeyRelatedField(
        source="document",
        queryset=Document.objects.all(),
        write_only=True,
    )
    creator_username = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(format="%d %b %Y", read_only=True)
    state = serializers.JSONField()
    version_vector = serializers.JSONField(write_only=True)

    class Meta:
        model = Version
        fields = [
            "id",
            "document_id",
            "title",
            "state",
            "version_vector",
            "created_at",
            "creator_username",
        ]
        read_only_fields = ["id", "created_at", "creator_username"]
        extra_kwargs = {
            "title": {"max_length": 50},
        }


class VersionStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Version
        fields = ["state"]
