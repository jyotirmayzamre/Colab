from rest_framework import serializers
from .models import Document, DocumentAccess


class DocumentSerializer(serializers.ModelSerializer):
    access = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'authors', 'access', 'state']
        read_only_fields=['id', 'authors', 'created_at', 'updated_at']

    def create(self, validated_data):
        user_id = self.context.get('user_id')
        title: str = validated_data.get('title')

        document = Document.objects.create_document(user_id, title) #type:ignore
        return document
    
    def get_access(self, obj):
        if hasattr(obj, 'user_access') and obj.user_access:
            return obj.user_access[0].level
        return None