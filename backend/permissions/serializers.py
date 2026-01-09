from .models import Document, DocumentAccess, ShareLink
from rest_framework import serializers
from documents.services import DocumentService

'''
Document Access Serializers
'''

class DocumentAccessUpdateSerializer(serializers.ModelSerializer):
    level = serializers.ChoiceField(choices=DocumentAccess.ACCESS)

    class Meta:
        model = DocumentAccess
        fields = ['level']
        validators = []

    def validate_level(self, value):
       if value == 'owner':
           raise serializers.ValidationError("Owner access cannot be assigned directly.")
       return value

class DocumentAccessInputSerializer(serializers.ModelSerializer):
    userId = serializers.UUIDField()
    docId = serializers.UUIDField()
    level = serializers.ChoiceField(choices=DocumentAccess.ACCESS)

    class Meta:
        model = DocumentAccess
        fields = ['userId', 'docId', 'level']
        validators = []

    def validate_document(self, value):
        try:
            doc = DocumentService.get_document(value)
        except Document.DoesNotExist:
            raise serializers.ValidationError("Document does not exist.")
        return value
    
    def validate_level(self, value):
       if value == 'owner':
           raise serializers.ValidationError("Owner access cannot be assigned directly.")
       return value

class DocumentAccessOutputSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = DocumentAccess
        fields = ['id', 'user','username', 'document', 'level']
        read_only_fields = fields


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
        try:
            doc = DocumentService.get_document(value)
        except Document.DoesNotExist:
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