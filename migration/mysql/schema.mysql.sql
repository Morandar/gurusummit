-- O2 Guru Summit - MySQL 8 Schema
-- Charset/Collation recommended for CZ strings
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `bi` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bi`;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  personalnumber VARCHAR(64) NOT NULL,
  firstname VARCHAR(128) NOT NULL,
  lastname VARCHAR(128) NOT NULL,
  position VARCHAR(128) NOT NULL,
  profileimage TEXT NULL,
  password_hash VARCHAR(255) NULL,
  visits INT NOT NULL DEFAULT 0,
  progress INT NOT NULL DEFAULT 0,
  visitedbooths JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_personalnumber (personalnumber)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booths (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(128) NOT NULL,
  login VARCHAR(128) NOT NULL,
  password VARCHAR(255) NULL,
  logo TEXT NULL,
  category VARCHAR(128) NULL,
  questions JSON NOT NULL,
  visits INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_booths_code (code),
  UNIQUE KEY uq_booths_login (login)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS program (
  id INT NOT NULL,
  time VARCHAR(16) NOT NULL,
  event VARCHAR(255) NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  category VARCHAR(64) NOT NULL DEFAULT 'lecture',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attendee_id BIGINT UNSIGNED NOT NULL,
  booth_id BIGINT UNSIGNED NOT NULL,
  answer_correct TINYINT(1) NULL,
  answered_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_visits_attendee_booth (attendee_id, booth_id),
  KEY idx_visits_attendee_id (attendee_id),
  KEY idx_visits_booth_id (booth_id),
  CONSTRAINT fk_visits_user FOREIGN KEY (attendee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_visits_booth FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS winners (
  id BIGINT UNSIGNED NOT NULL,
  userid BIGINT UNSIGNED NOT NULL,
  firstname VARCHAR(128) NOT NULL,
  lastname VARCHAR(128) NOT NULL,
  personalnumber VARCHAR(64) NOT NULL,
  position VARCHAR(128) NOT NULL,
  wonat DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_winners_wonat (wonat),
  CONSTRAINT fk_winners_user FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS final_votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voter_id BIGINT UNSIGNED NOT NULL,
  scores JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_final_votes_voter (voter_id),
  CONSTRAINT fk_final_votes_user FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience ENUM('all','participants','booth_staff') NOT NULL DEFAULT 'all',
  created_by VARCHAR(128) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notifications_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS banner (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  text TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  target_audience ENUM('all','participants','booth_staff') NOT NULL DEFAULT 'all',
  color ENUM('blue-purple','green-teal','red-pink','yellow-orange','indigo-cyan') NOT NULL DEFAULT 'blue-purple',
  created_by VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_banner_is_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discounted_phones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  manufacturer_name VARCHAR(255) NOT NULL,
  phone_model VARCHAR(255) NOT NULL,
  manufacturer_logo TEXT NULL,
  phone_image TEXT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(128) NOT NULL,
  `value` JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_settings_key (`key`)
) ENGINE=InnoDB;
