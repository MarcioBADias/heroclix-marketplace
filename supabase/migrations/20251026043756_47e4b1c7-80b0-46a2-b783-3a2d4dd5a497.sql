-- Enable realtime for pending_sales table to support notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_sales;