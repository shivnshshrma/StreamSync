import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from .middleware import JWTAuthMiddleware
from .routing import websocket_urlpatterns

django_application = get_asgi_application()
application = ProtocolTypeRouter({
    "http": django_application,
    "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
})
