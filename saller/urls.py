from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from .views import *
from . import views


router = DefaultRouter()

router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'sales', SaleViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
    path('u/', views.landing_view, name='landing'),         
    path('login/', views.login_view, name='login'),       
    path('register/', views.register_view, name='register'), 
    path('tableau-de-bord/', views.index_view, name='index'),  

]
