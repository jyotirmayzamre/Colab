from rest_framework import serializers
from .models import Version
from documents.services import DocumentService
from documents.models import Document
from accounts.models import User

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
        try:
            doc = DocumentService.get_document(value)
        except Document.DoesNotExist:
            raise serializers.ValidationError("Document does not exist.")
        return value
    

class VersionOutputSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    created_at = serializers.DateTimeField(format="%d %b %Y")  # type: ignore
    creator_username = serializers.CharField()

    class Meta:
        model = Version
        fields = ['id', 'title', 'created_at', 'creator_username']
