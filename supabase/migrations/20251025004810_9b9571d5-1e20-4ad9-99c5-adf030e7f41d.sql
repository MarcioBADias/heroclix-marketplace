-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update the unit prices function to consider approved sales as well
CREATE OR REPLACE FUNCTION public.update_unit_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.units
  SET 
    min_price = (
      SELECT MIN(price) FROM (
        SELECT price FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0
        UNION ALL
        SELECT price FROM public.pending_sales 
        WHERE listing_id IN (SELECT id FROM public.listings WHERE unit_id = NEW.unit_id)
        AND status = 'approved'
      ) prices
    ),
    avg_price = (
      SELECT AVG(price) FROM (
        SELECT price FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0
        UNION ALL
        SELECT price FROM public.pending_sales 
        WHERE listing_id IN (SELECT id FROM public.listings WHERE unit_id = NEW.unit_id)
        AND status = 'approved'
      ) prices
    ),
    max_price = (
      SELECT MAX(price) FROM (
        SELECT price FROM public.listings WHERE unit_id = NEW.unit_id AND available_quantity > 0
        UNION ALL
        SELECT price FROM public.pending_sales 
        WHERE listing_id IN (SELECT id FROM public.listings WHERE unit_id = NEW.unit_id)
        AND status = 'approved'
      ) prices
    ),
    updated_at = NOW()
  WHERE id = NEW.unit_id;
  RETURN NEW;
END;
$function$;

-- Create trigger for pending_sales to update unit prices when sales are approved
CREATE OR REPLACE FUNCTION public.update_unit_prices_from_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.units
    SET 
      min_price = (
        SELECT MIN(price) FROM (
          SELECT price FROM public.listings 
          WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          AND available_quantity > 0
          UNION ALL
          SELECT price FROM public.pending_sales 
          WHERE listing_id IN (
            SELECT id FROM public.listings 
            WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          )
          AND status = 'approved'
        ) prices
      ),
      avg_price = (
        SELECT AVG(price) FROM (
          SELECT price FROM public.listings 
          WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          AND available_quantity > 0
          UNION ALL
          SELECT price FROM public.pending_sales 
          WHERE listing_id IN (
            SELECT id FROM public.listings 
            WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          )
          AND status = 'approved'
        ) prices
      ),
      max_price = (
        SELECT MAX(price) FROM (
          SELECT price FROM public.listings 
          WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          AND available_quantity > 0
          UNION ALL
          SELECT price FROM public.pending_sales 
          WHERE listing_id IN (
            SELECT id FROM public.listings 
            WHERE unit_id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id)
          )
          AND status = 'approved'
        ) prices
      ),
      updated_at = NOW()
    WHERE id = (SELECT unit_id FROM public.listings WHERE id = NEW.listing_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_unit_prices_on_sale_approval ON public.pending_sales;
CREATE TRIGGER update_unit_prices_on_sale_approval
AFTER UPDATE ON public.pending_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_unit_prices_from_sales();