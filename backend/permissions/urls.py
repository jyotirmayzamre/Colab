from django.urls import path, include
from .views import PermissionViewSet, ShareLinkCreateView, ShareLinkAcceptView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'share', PermissionViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),
    path('create-share-link/', ShareLinkCreateView.as_view(), name='create_share_link'),
    path('accept-share/', ShareLinkAcceptView.as_view(), name='accept_share')
]