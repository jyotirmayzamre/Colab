from rest_framework import serializers
from .models import Version
from documents.services import DocumentService
from documents.models import Document

class VersionInputSerializer(serializers.ModelSerializer):
    docId = serializers.UUIDField()
    title = serializers.CharField(max_length=50)
    state = serializers.JSONField()

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
    updated_at = serializers.DateTimeField()

    class Meta:
        model = Version
        fields = ['id', 'title', 'updated_at']
