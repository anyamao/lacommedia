from django.db import models


class Book(models.Model):
    name = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)
    genre = models.CharField(max_length=100)
    year = models.IntegerField()
    description = models.TextField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    cover = models.ImageField(upload_to="covers/", blank=True, null=True)
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    views_count = models.PositiveIntegerField(default=0, verbose_name="Просмотры")

    def __str__(self):
        return self.name
