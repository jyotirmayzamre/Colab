from rest_framework import serializers
from .models import Document, DocumentAccess, ShareLink
from django.utils import timezone
from django.utils.timesince import timesince
import json
import base64

'''
Document Access Serializers
'''

class DocumentAccessInputSerializer(serializers.ModelSerializer):
    user = serializers.UUIDField()
    document = serializers.UUIDField()
    level = serializers.ChoiceField(choices=DocumentAccess.ACCESS)

    class Meta:
        model = DocumentAccess
        fields = ['user', 'document', 'level']
        validators = []

    def validate_document(self, value):
        if not Document.objects.filter(id=value).exists():
            raise serializers.ValidationError("Document does not exist.")
        return value
    
    def validate_level(self, value):
       if value == 'owner':
           raise serializers.ValidationError("Owner access cannot be assigned directly.")
       return value

class DocumentAccessOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentAccess
        fields = ['user', 'document', 'level']
        read_only_fields = fields


'''
Document Serializers
'''

class DocumentInputSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=50)

    class Meta:
        model = Document
        fields = ['title']

class DocumentOutputSerializer(serializers.ModelSerializer):
    access = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField() 
    num_users = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'access', 'title', 'updated_at', 'num_users']
        read_only_fields=['id', 'created_at', 'updated_at']

    
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

    
    
'''
ShareLink Serializers
'''

class ShareLinkInputSerializer(serializers.ModelSerializer):
    docId = serializers.UUIDField()
    role = serializers.ChoiceField(choices=ShareLink.ROLE)

    class Meta:
        model = ShareLink
        fields = ['docId', 'role']

    def validate_docId(self, value):
        if not Document.objects.filter(id=value).exists():
            raise serializers.ValidationError("Document does not exist.")
        return value


class ShareLinkOutputSerializer(serializers.ModelSerializer):
    link = serializers.SerializerMethodField()

    class Meta:
        model = ShareLink
        fields = ['link']

    def get_link(self, obj):
        link = f'http://localhost:5173/shareLink/{obj.token}?role={obj.role}'
        return link

