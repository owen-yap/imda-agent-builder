-- Drop the invitation handling function and trigger
DROP TRIGGER IF EXISTS on_user_created_with_invitation ON public.user_profiles;
DROP FUNCTION IF EXISTS public.handle_invitation_acceptance();