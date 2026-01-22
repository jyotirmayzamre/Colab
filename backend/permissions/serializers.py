from .models import Permission, ShareLink
from rest_framework import serializers

'''
Document Access Serializers
'''

class PermissionCreateSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    document_id = serializers.UUIDField()
    level = serializers.ChoiceField(choices=['viewer', 'editor'])

    def validate_level(self, value):
        if value == 'owner':
            raise serializers.ValidationError(
                'Owner level cannot be assigned'
            )
        return value


    
class PermissionUpdateSerializer(serializers.Serializer):
    level = serializers.ChoiceField(choices=['viewer', 'editor'])

    def validate_level(self, value):
       if value == 'owner':
           raise serializers.ValidationError("Cannot update to owner level")
       return value




class PermissionOutputSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Permission
        fields = [
            'id', 
            'user',
            'username', 
            'email',
            'document', 
            'level',
            'created_at',
            'updated_at'
            ]
        read_only_fields = fields


'''
ShareLink Serializers
'''

class ShareLinkCreateSerializer(serializers.Serializer):
    document_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=ShareLink.ROLE)

    def validate_role(self, value):
        if value == 'owner':
            raise serializers.ValidationError(
                'Owner role cannot be shared via link'
            )
        return value



class ShareLinkOutputSerializer(serializers.ModelSerializer):
    link = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = ShareLink
        fields = [
            'link',
            'role',
            'expires_at',
            'is_expired',
            'link'
            ]
        read_only_fields = fields

    def get_link(self, obj):
        
        base_url = 'http://localhost:5173'
        
        return f'{base_url}/shareLink/{obj.token}?role={obj.role}'
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    

class ShareLinkAcceptSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        if not ShareLink.objects.filter(token=value).exists():
            raise serializers.ValidationError('Invalid share link token')
        return value