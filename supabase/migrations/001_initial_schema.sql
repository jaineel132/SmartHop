-- ============================================
-- MySmartHop — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('rider', 'driver');
CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'ongoing', 'completed', 'cancelled');
CREATE TYPE vehicle_type AS ENUM ('car', 'bike', 'auto');

-- ============================================
-- 2. PROFILES TABLE
-- Linked to Supabase auth.users
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'rider',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. DRIVERS TABLE
-- Extra info for users with role = 'driver'
-- ============================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL DEFAULT 'car',
  license_plate TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_rides INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 4. RIDES TABLE
-- Core ride records
-- ============================================
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  drop_lat DOUBLE PRECISION NOT NULL,
  drop_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  status ride_status NOT NULL DEFAULT 'requested',
  fare NUMERIC(10,2),
  predicted_fare NUMERIC(10,2),
  distance_km NUMERIC(8,2),
  duration_min NUMERIC(8,2),
  cluster_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. RATINGS TABLE
-- Post-ride ratings (bidirectional)
-- ============================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ride_id, from_user_id)
);

-- ============================================
-- 6. CLUSTER RESULTS TABLE
-- ML clustering output storage
-- ============================================
CREATE TABLE cluster_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  cluster_id INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  silhouette_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. FARE PREDICTIONS TABLE
-- ML fare prediction output storage
-- ============================================
CREATE TABLE fare_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  predicted_solo_fare NUMERIC(10,2) NOT NULL,
  predicted_shared_fare NUMERIC(10,2) NOT NULL,
  savings_pct NUMERIC(5,2) NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. DRIVER LOCATIONS TABLE
-- Live GPS tracking for drivers
-- ============================================
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id)
);

-- ============================================
-- 9. INDEXES for performance
-- ============================================
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at DESC);
CREATE INDEX idx_drivers_is_available ON drivers(is_available);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_ratings_ride_id ON ratings(ride_id);
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);

-- ============================================
-- 10. AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'rider')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 12. AUTO-UPDATE DRIVER RATING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_driver_id UUID;
  avg_rating NUMERIC(3,2);
BEGIN
  -- Find the driver associated with the to_user_id
  SELECT d.id INTO target_driver_id
  FROM drivers d
  WHERE d.user_id = NEW.to_user_id;

  IF target_driver_id IS NOT NULL THEN
    SELECT COALESCE(AVG(r.score), 5.00) INTO avg_rating
    FROM ratings r
    WHERE r.to_user_id = NEW.to_user_id;

    UPDATE drivers
    SET rating = avg_rating
    WHERE id = target_driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_rating();

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- DRIVERS: Viewable by everyone, only owner can update
CREATE POLICY "Drivers are viewable by everyone"
  ON drivers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can update own record"
  ON drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own driver record"
  ON drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RIDES: Riders see own rides, drivers see assigned rides + requested rides
CREATE POLICY "Riders can view own rides"
  ON rides FOR SELECT
  USING (
    auth.uid() = rider_id
    OR auth.uid() IN (SELECT user_id FROM drivers WHERE id = rides.driver_id)
    OR (status = 'requested' AND auth.uid() IN (SELECT user_id FROM drivers WHERE is_available = true))
  );

CREATE POLICY "Riders can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Ride participants can update rides"
  ON rides FOR UPDATE
  USING (
    auth.uid() = rider_id
    OR auth.uid() IN (SELECT user_id FROM drivers WHERE id = rides.driver_id)
  );

-- RATINGS: Viewable by ride participants, insertable by ride participants
CREATE POLICY "Ratings viewable by participants"
  ON ratings FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can rate after ride"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- CLUSTER RESULTS: Viewable by participants
CREATE POLICY "Cluster results viewable by all authenticated"
  ON cluster_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert cluster results"
  ON cluster_results FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- FARE PREDICTIONS: Viewable by participants
CREATE POLICY "Fare predictions viewable by all authenticated"
  ON fare_predictions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert fare predictions"
  ON fare_predictions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- DRIVER LOCATIONS: Viewable by everyone, only driver can update
CREATE POLICY "Driver locations viewable by all authenticated"
  ON driver_locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Drivers can upsert own location"
  ON driver_locations FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM drivers WHERE id = driver_locations.driver_id));

CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM drivers WHERE id = driver_locations.driver_id));

-- ============================================
-- 14. ENABLE REALTIME for key tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
