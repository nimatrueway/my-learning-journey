\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA course_lab;
CREATE TABLE course_lab.products (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL CHECK (stock >= 0)
);
CREATE TABLE course_lab.orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE course_lab.order_items (
  order_id bigint REFERENCES course_lab.orders(id),
  product_id bigint REFERENCES course_lab.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, product_id)
);
CREATE TABLE course_lab.on_call (
  name text PRIMARY KEY,
  available boolean NOT NULL
);
INSERT INTO course_lab.products VALUES (1, 'Notebook', 5.00, 10), (2, 'Pencil', 1.50, 20);
INSERT INTO course_lab.on_call VALUES ('alice', true), ('bob', true);
INSERT INTO course_lab.orders (customer_id, status, created_at)
SELECT item % 1000, CASE WHEN item % 10 = 0 THEN 'pending' ELSE 'paid' END,
       timestamptz '2025-01-01 00:00:00+00' + item * interval '1 minute'
FROM generate_series(1, 20000) AS series(item);
COMMIT;
ANALYZE course_lab.products;
ANALYZE course_lab.orders;