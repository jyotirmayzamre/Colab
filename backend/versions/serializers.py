from rest_framework import serializers
from .models import Version
from documents.models import Document


class VersionInputSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=50)
    state = serializers.JSONField()
    document_id = serializers.PrimaryKeyRelatedField(
        source="document",
        queryset=Document.objects.all()
    )

    class Meta:
        model = Version
        fields = ['document_id', 'title', 'state']

    

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