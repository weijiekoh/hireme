from django.urls import path

from . import views

urlpatterns = [
    path(r'', views.index, name='index'),
    path(r'auction/', views.index, name='index'),
    path(r'bids/', views.bids, name='bids'),
]

