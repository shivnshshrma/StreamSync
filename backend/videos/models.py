import uuid
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models

def video_upload_path(instance, filename):
    return f"videos/{instance.owner_id}/{uuid.uuid4()}{filename[filename.rfind('.'):]}"

class Video(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="videos")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=video_upload_path, validators=[FileExtensionValidator(["mp4", "webm", "mov"])])
    thumbnail = models.ImageField(upload_to="thumbnails/", blank=True, null=True)
    duration = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
