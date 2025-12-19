from django.urls import path, include
from .views import DocumentAccessViewSet, CreateShareLinkView, AcceptShareView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'share', DocumentAccessViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),
    path('createShareLink/', CreateShareLinkView.as_view(), name='create_share_link'),
    path('acceptShare/', AcceptShareView.as_view(), name='accept_share')
]