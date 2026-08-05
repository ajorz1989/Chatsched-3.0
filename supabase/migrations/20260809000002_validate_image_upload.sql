-- Enable storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true) ON CONFLICT DO NOTHING;

-- Policy to restrict uploads to images under 5MB
CREATE OR REPLACE FUNCTION storage.validate_image_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Check file size (5MB limit)
    IF NEW.size > 5 * 1024 * 1024 THEN
        RAISE EXCEPTION 'File size exceeds 5MB limit';
    END IF;
    
    -- Check MIME type
    IF NEW.mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/svg+xml') THEN
        RAISE EXCEPTION 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_image_upload
    BEFORE INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION storage.validate_image_upload();
