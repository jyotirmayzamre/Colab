from rest_framework import serializers
from .models import Version
from permissions.services import DocumentAccessService
from documents.models import Document


class VersionInputSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=50)
    state = serializers.JSONField()
    docId = serializers.PrimaryKeyRelatedField(
        source="document",
        queryset=Document.objects.all()
    )

    class Meta:
        model = Version
        fields = ['docId', 'title', 'state']

    def validate_document(self, value):
        request = self.context.get("request")
        user = request.user if request else None

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        access = DocumentAccessService.get_access(value, user.id)
        if access.level == 'viewer':
            raise serializers.ValidationError("Current user is not an owner or an editor.")

        return value
    

class VersionOutputSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    created_at = serializers.DateTimeField(format="%d %b %Y")  # type: ignore
    creator_username = serializers.CharField()

    class Meta:
        model = Version
        fields = ['id', 'title', 'created_at', 'creator_username']


class VersionStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Version
        fields = ['state']