from django.shortcuts import render
from project import settings


def index(request):
    return render(request, "app/index.html", {"DEBUG": settings.DEBUG})
