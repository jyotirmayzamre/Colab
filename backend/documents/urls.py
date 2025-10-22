from django.urls import path, include
from .views import DocumentViewSet, DocumentAccessViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'documentAccess', DocumentAccessViewSet, basename='documentAccess')

urlpatterns = [
    path('', include(router.urls)),    
]