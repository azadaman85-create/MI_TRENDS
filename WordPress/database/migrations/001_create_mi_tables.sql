-- Migration 001 (MI Trends Core 1.0.0): create the two custom tables.
-- Applied automatically by MI_Core_Schema::install(). Kept for reference.

CREATE TABLE wp_mi_subscribers (
  id          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(190)        NOT NULL,                       -- lower-cased
  source      VARCHAR(60)         NOT NULL DEFAULT 'footer',      -- footer | notify:gift-cards | notify:stores
  status      VARCHAR(20)         NOT NULL DEFAULT 'subscribed',  -- subscribed | unsubscribed
  user_id     BIGINT(20) UNSIGNED DEFAULT NULL,                   -- wp_users.ID when signed in, else 0/NULL
  ip_hash     CHAR(64)            DEFAULT NULL,                   -- HMAC-SHA256 of the IP (never the raw IP)
  created_at  DATETIME            NOT NULL,                       -- UTC
  updated_at  DATETIME            NOT NULL,                       -- UTC
  PRIMARY KEY (id),
  UNIQUE KEY email_source (email, source),
  KEY status (status),
  KEY created_at (created_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Every stock change with its reason (WooCommerce stores only the current level).
CREATE TABLE wp_mi_stock_movements (
  id            BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id    BIGINT(20) UNSIGNED NOT NULL,            -- parent product (wp_posts.ID)
  variation_id  BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,  -- size variation (wp_posts.ID), 0 for simple products
  sku           VARCHAR(100) DEFAULT NULL,               -- e.g. MIT-TEE-01-M (snapshot)
  size          VARCHAR(40)  DEFAULT NULL,               -- e.g. M (snapshot)
  delta         INT(11)      NOT NULL,                   -- stock_after - stock_before
  stock_before  INT(11)      DEFAULT NULL,
  stock_after   INT(11)      DEFAULT NULL,
  reason        VARCHAR(30)  NOT NULL,                   -- order | restock | return | adjustment | edit | import
  order_id      BIGINT(20) UNSIGNED DEFAULT NULL,        -- WooCommerce order ID when caused by an order
  user_id       BIGINT(20) UNSIGNED DEFAULT NULL,        -- staff member who made the change
  note          VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME     NOT NULL,                   -- UTC
  PRIMARY KEY (id),
  KEY product_created (product_id, created_at),
  KEY variation_id (variation_id),
  KEY order_id (order_id),
  KEY reason_created (reason, created_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
