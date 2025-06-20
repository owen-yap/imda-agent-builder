-- Custom SQL migration file, put your code below! --
-- Custom SQL migration file for handling user invitations

-- Make sure metadata column exists on user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Update the handle_new_user function to include metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data
  );
  RETURN NEW;
END;
$$;

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  workspace_id UUID;
  invitation_id UUID;
  invited_role TEXT;
BEGIN
  -- Check if the user has invitation metadata
  IF NEW.metadata IS NOT NULL AND 
     NEW.metadata ? 'workspaceInvitation' AND 
     NEW.metadata ? 'invitationId' AND 
     NEW.metadata ? 'invitedRole' THEN
    
    -- Extract invitation data and convert to proper types
    workspace_id := (NEW.metadata->>'workspaceInvitation')::UUID;
    invitation_id := (NEW.metadata->>'invitationId')::UUID;
    invited_role := NEW.metadata->>'invitedRole';
    
    -- Add user to workspace with appropriate role
    INSERT INTO public.user_roles (user_id, workspace_id, role)
    VALUES (NEW.id, workspace_id, invited_role);
    
    -- Update workspace_id in the user_profiles table
    UPDATE public.user_profiles 
    SET workspace_id = workspace_id
    WHERE id = NEW.id;
    
    -- Update invitation status to 'accepted'
    UPDATE public.workspace_invitations
    SET status = 'accepted'
    WHERE id = invitation_id;
    
    RAISE NOTICE 'User % added to workspace % with role %', NEW.id, workspace_id, invited_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a trigger to handle invitation acceptance when a new user profile is created
DROP TRIGGER IF EXISTS on_user_created_with_invitation ON public.user_profiles;
CREATE TRIGGER on_user_created_with_invitation
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_acceptance(); 
  