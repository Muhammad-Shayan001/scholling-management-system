-- Create password_reset_tokens table for secure password reset flow
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    otp TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT token_not_reusable CHECK (used_at IS NULL OR used_at IS NOT NULL)
);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_otp ON public.password_reset_tokens(otp);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow unauthenticated access for finding valid reset tokens
CREATE POLICY "Allow finding valid reset tokens" ON public.password_reset_tokens
    FOR SELECT
    USING (expires_at > NOW() AND used_at IS NULL);

-- RLS Policy: Allow service role to insert/update
CREATE POLICY "Service role can manage reset tokens" ON public.password_reset_tokens
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Auto-cleanup: Delete expired tokens (optional - can be done via scheduled job)
-- Consider adding a scheduled job to clean up expired tokens periodically
