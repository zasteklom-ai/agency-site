-- Одноразовый baseline для ЧИСТОЙ продуктовой базы.
--
-- История: первые таблицы (cottages, cottage_photos, leads) появились на dev
-- через `db:push`, а миграция 0000_bookings-ical-leads создана как дельта
-- (generate --custom) и ПРЕДПОЛАГАЕТ, что эти таблицы уже существуют.
-- Поэтому на пустой БД drizzle-миграции 0000/0001 не могут примениться сами:
-- bookings ссылается FOREIGN KEY на cottages, которой ещё нет.
--
-- Что делает этот файл: создаёт базовые таблицы в состоянии ДО миграции 0000
-- (без колонок ical_* и video_url — их добавят миграции 0000 и 0001).
--
-- Применять ТОЛЬКО один раз на пустой базе, до запуска drizzle-миграций:
--   mysql -u agency -p agency_db < db/bootstrap-prod.sql
-- После этого `npm run db:migrate` применит 0000 и 0001 штатно.
-- На dev-базе и на базе, где сиды уже залиты, этот файл НЕ применять.

CREATE TABLE `cottages` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`external_id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` varchar(512),
	`district` varchar(128),
	`lat` double,
	`lng` double,
	`bedrooms` int,
	`beds` int,
	`total_area` double,
	`land_area` double,
	`price` int,
	`has_banya` tinyint(1) NOT NULL DEFAULT false,
	`has_sauna` tinyint(1) NOT NULL DEFAULT false,
	`has_pool` tinyint(1) NOT NULL DEFAULT false,
	`has_kupel` tinyint(1) NOT NULL DEFAULT false,
	`has_billiard` tinyint(1) NOT NULL DEFAULT false,
	`has_bbq` tinyint(1) NOT NULL DEFAULT false,
	`price_weekday` int,
	`price_friday` int,
	`price_saturday` int,
	`price_weekend` int,
	`price_newyear` int,
	`deposit` int,
	`amenities` text,
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY `cottages_external_id_unique` (`external_id`)
);

CREATE TABLE `cottage_photos` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`cottage_id` bigint unsigned NOT NULL,
	`url` varchar(512) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`)
);

CREATE TABLE `leads` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`name` varchar(128) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`cottage_id` bigint unsigned,
	`message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	PRIMARY KEY (`id`)
);
