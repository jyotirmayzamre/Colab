from django.contrib import admin
from .models import DocumentAccess

# Register your models here.
@admin.register(DocumentAccess)
class DocumentAccessAdmin(admin.ModelAdmin):
    list_display = ('document', 'user', 'level')