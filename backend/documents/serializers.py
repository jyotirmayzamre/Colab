from rest_framework import serializers
from .models import Document
from django.utils import timezone
from django.utils.timesince import timesince
from permissions.services import DocumentAccessService


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
        access = DocumentAccessService.get_access(document=obj, userId=user_id) #type: ignore
        return access.level
    
    def get_updated_at(self, obj):
        now = timezone.now()
        diff = timesince(obj.updated_at, now)
        return f"{diff.split(', ')[0]} ago"
    
    def get_num_users(self, obj):
        return obj.authors.count()

    

