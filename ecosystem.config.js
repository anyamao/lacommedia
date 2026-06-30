module.exports = {
  apps: [
    {
      name: 'lacommedia-frontend',
      cwd: '/home/vika/lacommedia/frontend',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3080,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/home/vika/logs/frontend-error.log',
      out_file: '/home/vika/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
    },
    {
      name: 'lacommedia-backend',
      interpreter: 'python3',  // ✅ Явно указываем интерпретатор
      interpreter_args: '-m gunicorn --workers 3 --bind 0.0.0.0:8080 lacommedia.wsgi:application',
      cwd: '/home/vika/lacommedia/backend',
      script: 'dummy',  // Не используется, т.к. interpreter_args
      env: {
        DJANGO_SETTINGS_MODULE: 'lacommedia.settings',
        PYTHONPATH: '/home/vika/lacommedia/backend',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/home/vika/logs/backend-error.log',
      out_file: '/home/vika/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
    },
  ],
};
