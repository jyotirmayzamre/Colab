from .views import VersionViewSet
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', VersionViewSet, basename='')

urlpatterns = [
    path('', include(router.urls)),
]

