FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libonig-dev \
        unzip \
        git \
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring bcmath zip gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize \
    && php artisan storage:link || true

EXPOSE 8000

# Migrations/seeding are run explicitly (see README "Running with Docker")
# rather than automatically on boot, so a container restart never silently
# re-runs them against a database that's already live.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
