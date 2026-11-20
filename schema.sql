-- RestoSphere: idempotent schema for Neon PostgreSQL
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  pass_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dining_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  seats int NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'available',
  pos_x int NOT NULL DEFAULT 0,
  pos_y int NOT NULL DEFAULT 0,
  UNIQUE(org_id, name)
);
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Main Course',
  emoji text NOT NULL DEFAULT '🍽️',
  price numeric(12,2) NOT NULL DEFAULT 0,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  prep_minutes int NOT NULL DEFAULT 15,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  quantity numeric(14,2) NOT NULL DEFAULT 0,
  threshold numeric(14,2) NOT NULL DEFAULT 5,
  cost_per_unit numeric(12,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS recipes (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity numeric(12,3) NOT NULL,
  PRIMARY KEY(product_id, inventory_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  table_id uuid REFERENCES dining_tables(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'staff',
  note text NOT NULL DEFAULT '',
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  table_id uuid REFERENCES dining_tables(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_phone text NOT NULL DEFAULT '',
  party_size int NOT NULL DEFAULT 2,
  reserved_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_tables_org ON dining_tables(org_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_created ON orders(org_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(org_id,reserved_for);
