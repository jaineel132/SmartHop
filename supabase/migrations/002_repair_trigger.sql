-- ============================================
-- MySmartHop — Repair Trigger Function
-- Fix for "Database error saving new user"
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role public.user_role := 'rider';
  chosen_role_text TEXT;
BEGIN
  -- Safely extract role text
  chosen_role_text := NEW.raw_user_meta_data->>'role';
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    CASE 
      WHEN chosen_role_text = 'driver' THEN 'driver'::public.user_role
      ELSE 'rider'::public.user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- In a real app we'd log this, but for now we just let the trigger fail
    -- with a slightly more informative vibe if we could, but Supabase obscures it.
    RAISE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
