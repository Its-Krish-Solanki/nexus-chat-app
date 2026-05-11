import asyncio
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .db import list_rooms, get_or_create_room, get_room_messages


def _run(coro):
    """Run async coroutine from sync Django view."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@require_http_methods(["GET"])
def rooms_list(request):
    rooms = _run(list_rooms())
    return JsonResponse({"rooms": rooms})


@csrf_exempt
@require_http_methods(["POST"])
def create_room(request):
    body = json.loads(request.body or "{}")
    name = body.get("name", "").strip().replace(" ", "-").lower()
    if not name:
        return JsonResponse({"error": "name required"}, status=400)
    room = _run(get_or_create_room(name))
    return JsonResponse({"room": room}, status=201)


@require_http_methods(["GET"])
def room_messages(request, room_name):
    msgs = _run(get_room_messages(room_name, limit=100))
    return JsonResponse({"messages": msgs})
