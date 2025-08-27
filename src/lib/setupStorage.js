import { supabase } from './supabase';

/**
 * Setup Supabase storage bucket for document storage
 * This should be run once to initialize the storage bucket
 */
export async function setupStorageBucket() {
  try {
    console.log('Setting up Supabase storage bucket...');

    // Create the documents bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }

    const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    
    if (!documentsBucket) {
      console.log('Creating documents bucket...');
      
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
        allowedMimeTypes: ['text/markdown', 'text/plain'],
        fileSizeLimit: 10485760 // 10MB limit for markdown files
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return { success: false, error: error.message };
      }

      console.log('Documents bucket created successfully:', data);
    } else {
      console.log('Documents bucket already exists');
    }

    // Set up RLS policies for the bucket (if needed)
    await setupStoragePolicies();

    return { success: true, message: 'Storage bucket setup completed' };

  } catch (error) {
    console.error('Storage setup error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Setup Row Level Security policies for storage
 */
async function setupStoragePolicies() {
  try {
    console.log('Setting up storage policies...');
    
    // Note: These policies would typically be set up in the Supabase dashboard
    // or via SQL commands. This is just for reference.
    
    const policies = [
      {
        name: 'Users can upload their own documents',
        definition: `
          CREATE POLICY "Users can upload their own documents" ON storage.objects
          FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[2]);
        `
      },
      {
        name: 'Users can view their own documents',
        definition: `
          CREATE POLICY "Users can view their own documents" ON storage.objects
          FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[2]);
        `
      },
      {
        name: 'Users can delete their own documents',
        definition: `
          CREATE POLICY "Users can delete their own documents" ON storage.objects
          FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[2]);
        `
      }
    ];

    console.log('Storage policies reference:', policies);
    console.log('Note: Policies should be set up in Supabase dashboard or via SQL');

  } catch (error) {
    console.error('Error setting up storage policies:', error);
  }
}

/**
 * Test storage functionality
 */
export async function testStorageSetup() {
  try {
    console.log('Testing storage setup...');

    // Test file upload
    const testContent = '# Test Document\n\nThis is a test markdown file.';
    const testFileName = `test-${Date.now()}.md`;
    const testPath = `test/${testFileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(testPath, testContent, {
        contentType: 'text/markdown'
      });

    if (error) {
      console.error('Storage test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('Test file uploaded successfully:', data);

    // Test file retrieval
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(testPath);

    console.log('Test file URL:', urlData.publicUrl);

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([testPath]);

    if (deleteError) {
      console.warn('Could not delete test file:', deleteError);
    } else {
      console.log('Test file cleaned up successfully');
    }

    return { 
      success: true, 
      message: 'Storage test completed successfully',
      testUrl: urlData.publicUrl
    };

  } catch (error) {
    console.error('Storage test error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats() {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error getting storage stats:', error);
      return { success: false, error: error.message };
    }

    const totalFiles = data.length;
    const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

    return {
      success: true,
      stats: {
        totalFiles,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      }
    };

  } catch (error) {
    console.error('Storage stats error:', error);
    return { success: false, error: error.message };
  }
}
