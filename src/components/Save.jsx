import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createNote, updateNote } from '../config/firebase';
import { supabase } from '../config/supabase';
import './Save.css';

function Save({ noteContent, summaryContent }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    teacher: '',
    topic: '',
    key_points: '',
    tags: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [images, setImages] = useState([]);
  // State for image management
  const [_deletingImages, _setDeletingImages] = useState(new Set());
  const [_loadingImages, _setLoadingImages] = useState(new Map());
  const [_imageRetries, _setImageRetries] = useState(new Map());
  const [previewImage, setPreviewImage] = useState('');
  
  const MAX_RETRIES = 3;

  useEffect(() => {
    // If coming from recording, set the content
    if (noteContent) {
      // Auto-generate a title if not provided
      const firstLine = noteContent.split('\n')[0];
      const defaultTitle = firstLine.length > 50 ? `${firstLine.substring(0, 47)}...` : firstLine;
      
      setFormData(prev => ({
        ...prev,
        title: defaultTitle,
        key_points: generateKeyPoints(noteContent)
      }));
    }
  }, [noteContent]);

  const generateKeyPoints = (content) => {
    // Simple key points generation - first 3 non-empty lines
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
      .map((point, index) => `${index + 1}. ${point}`)
      .join('\n');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploadError('');
      setIsUploading(true);

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, or GIF');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      setImages(prevImages => [...prevImages, publicUrl]);
      setPreviewImage(publicUrl);
      
      // Clear the file input
      e.target.value = null;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image deletion (kept for reference)
  const _handleDeleteImage = async (imageUrl, index) => {
    try {
      _setDeletingImages(prev => new Set([...prev, index]));
      
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const filePath = `temp/${urlParts[urlParts.length - 1]}`;

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('note-images')
        .remove([filePath]);

      if (error) throw error;

      // Remove from UI if deletion was successful
      setImages(prevImages => prevImages.filter((_, i) => i !== index));
      setPreviewImage('');
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadError('Failed to delete image. Please try again.');
    } finally {
      _setDeletingImages(new Set());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to save notes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newNote = {
        note: noteContent || '',
        summary: summaryContent || '',
        title: formData.title || 'Untitled Note',
        teacher: formData.teacher || '',
        topic: formData.topic || '',
        key_points: formData.key_points || '',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        image_url: previewImage || '',
        exported: false
      };

      const { noteId } = await createNote(auth.currentUser.uid, newNote);
      
      // Move images from temp to the note's folder
      if (images.length > 0) {
        const noteImages = [];
        for (const imageUrl of images) {
          const urlParts = imageUrl.split('/');
          const oldPath = `temp/${urlParts[urlParts.length - 1]}`;
          const newPath = `${noteId}/${urlParts[urlParts.length - 1]}`;
          
          // Copy the file to the new location
          const { error: copyError } = await supabase.storage
            .from('note-images')
            .copy(oldPath, newPath);
            
          if (copyError) throw copyError;
          
          // Delete the temp file
          await supabase.storage
            .from('note-images')
            .remove([oldPath]);
            
          const { data: { publicUrl } } = supabase.storage
            .from('note-images')
            .getPublicUrl(newPath);
            
          noteImages.push(publicUrl);
        }
        
        // Update the note with the new image URLs
        if (noteImages.length > 0) {
          await updateNote(noteId, { image_url: noteImages[0] });
        }
      }
      
      // Redirect to the new note's page
      navigate(`/notes/${noteId}`); 
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="save-container">
      <div className="save-header">
        <h2>Save Your Note</h2>
        <p>Review and edit your note before saving</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="save-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="teacher">Teacher</label>
            <input
              type="text"
              id="teacher"
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="topic">Topic</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="key_points">Key Points</label>
          <textarea
            id="key_points"
            name="key_points"
            value={formData.key_points}
            onChange={handleChange}
            className="form-control"
            rows="5"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g., math, algebra, calculus"
          />
        </div>
        
        <div className="form-group">
          <label>Upload Image</label>
          <div className="image-upload-container">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
              disabled={isUploading || loading}
            />
            <label htmlFor="image-upload" className={`btn-upload ${isUploading ? 'uploading' : ''}`}>
              <span className="btn-upload-content">
                {isUploading ? (
                  <div className="spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                  </svg>
                )}
                {isUploading ? 'Uploading...' : 'Choose an Image'}
              </span>
            </label>
            {uploadError && <div className="upload-error">{uploadError}</div>}
            
            {previewImage && (
              <div className="image-preview">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="preview-image"
                />
                <button 
                  type="button"
                  className="btn-remove-image"
                  onClick={() => {
                    setPreviewImage('');
                    setImages([]);
                  }}
                  disabled={isUploading || loading}
                >
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="preview-section">
          <h3>Preview</h3>
          <div className="preview-content">
            <h4>Note Content:</h4>
            <div className="preview-text">{noteContent || 'No content available'}</div>
            
            <h4>Summary:</h4>
            <div className="preview-text">{summaryContent || 'No summary available'}</div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => window.history.back()}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Save;