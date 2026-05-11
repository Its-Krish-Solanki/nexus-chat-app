from django.urls import path
from . import views

urlpatterns = [
    path("rooms/", views.rooms_list),
    path("rooms/create/", views.create_room),
    path("rooms/<str:room_name>/messages/", views.room_messages),
]
