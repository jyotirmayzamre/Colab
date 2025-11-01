from rest_framework import serializers
from .models import Document, DocumentAccess
from django.utils import timezone
from django.utils.timesince import timesince

class DocumentAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentAccess
        fields = ['user', 'document', 'level']
        validators = []

    def create(self, validated_data):
        level = validated_data['level']
        userId = validated_data['user'].id
        docId = validated_data['document'].id

        docAccess, created = DocumentAccess.objects.create_or_update_access(docId, userId, level)
        return docAccess


class DocumentSerializer(serializers.ModelSerializer):
    access = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField() 
    num_users = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'access', 'title', 'updated_at', 'num_users']
        read_only_fields=['id', 'authors', 'created_at', 'updated_at']

    def create(self, validated_data):
        user_id = self.context.get('user_id')

        document = Document.objects.create_document(user_id) #type:ignore
        return document
    
    
    def get_access(self, obj):
        user_id = self.context.get('user_id')
        access = DocumentAccess.objects.get(document=obj, user_id=user_id)
        return access.level
    
    def get_updated_at(self, obj):
        now = timezone.now()
        diff = timesince(obj.updated_at, now)
        return f"{diff.split(', ')[0]} ago"
    
    def get_num_users(self, obj):
        return obj.authors.count()