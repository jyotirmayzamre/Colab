from django.contrib import admin
from .models import Document, DocumentAccess

# Register your models here.
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title')
    filter_horizontal = ('authors',)

@admin.register(DocumentAccess)
class DocumentAccessAdmin(admin.ModelAdmin):
    list_display = ('document', 'user', 'level')