import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lacommedia.settings')
django.setup()

from apps.books.models import Book as OldBook, Character as OldCharacter
from apps.content.models import Content, Character
from django.contrib.contenttypes.models import ContentType

def migrate_books():
    print("🔄 Перенос книг в новую систему...")
    
    for old_book in OldBook.objects.all():
        # Создаем контент
        content = Content.objects.create(
            content_type='book',
            title=old_book.name,
            description=old_book.description,
            cover=old_book.cover,
            rating=old_book.rating,
            year=old_book.year,
            genre=old_book.genre,
            country=old_book.country,
            views_count=old_book.views_count,
            hours_to_read=old_book.hours_to_read,
            brief_summary=old_book.brief_summary,
            review=old_book.review,
            ideas=old_book.ideas,
            interesting_facts=old_book.interesting_facts,
            is_active=old_book.is_active,
            created_at=old_book.created_at,
            updated_at=old_book.updated_at,
            extra_data={
                'author': old_book.author,
            }
        )
        
        # Переносим персонажей
        for old_char in old_book.characters.all():
            Character.objects.create(
                content=content,
                image=old_char.image,
                first_name=old_char.first_name,
                last_name=old_char.last_name,
                about=old_char.about,
                created_at=old_char.created_at
            )
        
        print(f"  ✅ {content.title} перенесена")

if __name__ == '__main__':
    migrate_books()
    print("✅ Готово!")
