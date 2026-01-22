from django.db import models
import uuid
from django.db.models import Count


class DocumentManager(models.Manager): 
    def for_user_with_metadata(self, user):
        return (
            self.filter(permissions__user=user)
            .annotate(
                permission=models.F("permissions__level"),
                num_users=Count("permissions", distinct=True),
            )
            .order_by("-updated_at")
        )


    

def default_state():
    return []

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=50)
    state = models.JSONField(default=default_state)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: 'DocumentManager' = DocumentManager()

    def __str__(self) -> str:
        return self.title






    



    