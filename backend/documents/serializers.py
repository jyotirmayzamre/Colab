from rest_framework import serializers
from .models import Document
from django.utils import timezone
from django.utils.timesince import timesince


'''
Document Serializers
'''

class DocumentInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title']

class DocumentOutputSerializer(serializers.ModelSerializer):
    permission = serializers.CharField(read_only=True)
    num_users = serializers.IntegerField(read_only=True)
    updated_at = serializers.SerializerMethodField() 
    

    class Meta:
        model = Document
        fields = ['id', 'permission', 'title', 'updated_at', 'num_users']
        read_only_fields=['id', 'updated_at']

    
    def get_updated_at(self, obj):
        now = timezone.now()
        diff = timesince(obj.updated_at, now)
        return f"{diff.split(', ')[0]} ago"
    
    
    

