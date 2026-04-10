from typing import cast
from django.db import models
import uuid
from permissions.models import Permission
from django.db.models import Count, OuterRef, Subquery


class DocumentManager(models.Manager): 
    def for_user_with_metadata(self, user):
        user_count = Permission.objects.filter(
            document=OuterRef('pk')
        ).values('document').annotate(
            count=Count('id')
        ).values('count')

        return (
            self.filter(permissions__user=user)
            .annotate(
                permission=models.F("permissions__level"),
                num_users=Subquery(user_count),
            )
            .order_by("-updated_at")
        )


    

def default_state():
    return [[]]

def default_version_vector():
    return {}

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=50)
    state = models.JSONField(default=default_state)
    version_vector = models.JSONField(default=default_version_vector)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: 'DocumentManager' = DocumentManager()

    def __str__(self) -> str:
        return cast(str, self.title)






    



    
