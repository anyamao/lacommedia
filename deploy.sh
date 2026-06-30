#!/bin/bash
cd /var/www/lacommedia

# Обновляем код
git pull origin main

# Бэкенд
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Перезапускаем службы
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# Фронтенд
cd ../frontend
pnpm install
pnpm build

# Перезапускаем PM2
pm2 restart lacommedia-frontend

echo "✅ Деплой завершен!"
