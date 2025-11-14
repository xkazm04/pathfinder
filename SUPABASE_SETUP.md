# Supabase Setup Guide

This guide explains how to set up Supabase storage buckets for the Pathfinder application.

## Screenshot Storage Bucket

Pathfinder stores test screenshots in a Supabase storage bucket called `test-screenshots`.

### Creating the Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `test-screenshots`
   - **Public bucket**: ✅ Enable (so screenshots can be accessed via public URLs)
   - **File size limit**: 50MB (recommended)
   - **Allowed MIME types**: `image/png, image/jpeg, image/webp`

5. Click **Create bucket**

### Setting Bucket Policies

To allow the application to upload and retrieve screenshots:

1. Click on the `test-screenshots` bucket
2. Go to **Policies** tab
3. Add the following policies:

#### Upload Policy
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'test-screenshots');
```

#### Read Policy
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'test-screenshots');
```

#### Delete Policy (optional, for cleanup)
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'test-screenshots');
```

### Verification

To verify the bucket is set up correctly:

1. Run the Designer workflow and capture screenshots
2. Check the browser console for:
   - ✅ "Screenshot uploaded successfully" (no warnings)
   - ❌ "Screenshot storage bucket not found" (bucket missing)

3. Check the Supabase Storage dashboard to see uploaded files

### Bucket Structure

Screenshots are organized in the following structure:

```
test-screenshots/
├── designer-{timestamp}/          # Designer preview screenshots
│   ├── mobile_small/
│   │   └── screenshot-{timestamp}.png
│   ├── tablet/
│   │   └── screenshot-{timestamp}.png
│   └── desktop/
│       └── screenshot-{timestamp}.png
└── {testRunId}/                   # Test execution screenshots
    ├── mobile/
    │   ├── initial-load-{timestamp}.png
    │   ├── step-1-{timestamp}.png
    │   └── final-state-{timestamp}.png
    └── desktop/
        ├── initial-load-{timestamp}.png
        └── final-state-{timestamp}.png
```

### Troubleshooting

#### Screenshots not uploading
- Verify the bucket name is exactly `test-screenshots`
- Check that the bucket is marked as **Public**
- Ensure the upload policy allows authenticated users
- Check your `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Permission denied errors
- Review the bucket policies
- Ensure your Supabase service role key has storage permissions
- Check that RLS (Row Level Security) policies are correctly configured

#### Storage quota exceeded
- Check your Supabase plan's storage limits
- Consider implementing automatic cleanup of old screenshots
- Use the `deleteTestRunScreenshots()` function to remove old test data

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Limits](https://supabase.com/docs/guides/storage#file-limits)
