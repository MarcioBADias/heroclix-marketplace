-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units table (para armazenar as peças únicas do mercado)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  image_url TEXT NOT NULL,
  min_price DECIMAL(10,2),
  avg_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection, unit_number)
);

-- Create listings table (anúncios de vendedores)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create pending_sales table
CREATE TABLE public.pending_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_sales ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Units policies (públicas para visualização)
CREATE POLICY "Units are viewable by everyone" ON public.units FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create units" ON public.units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Unit owners can update their units" ON public.units FOR UPDATE USING (true);

-- Listings policies
CREATE POLICY "Listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their listings" ON public.listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their listings" ON public.listings FOR DELETE USING (auth.uid() = seller_id);

-- Cart policies
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Pending sales policies
CREATE POLICY "Sellers can view their pending sales" ON public.pending_sales FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can view their pending purchases" ON public.pending_sales FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "System can create pending sales" ON public.pending_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can update their pending sales" ON public.pending_sales FOR UPDATE USING (auth.uid() = seller_id);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function para atualizar preços do mercado
CREATE OR REPLACE FUNCTION public.update_unit_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.units
  SET 
    min_price = (SELECT MIN(price) FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0),
    avg_price = (SELECT AVG(price) FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0),
    max_price = (SELECT MAX(price) FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0),
    updated_at = NOW()
  WHERE id = NEW.unit_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_prices_on_listing_change
  AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_unit_prices();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_sales_updated_at BEFORE UPDATE ON public.pending_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();