from django.contrib import admin
from .models import Version

# Register your models here.
@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'document', 'creator', 'created_at')

