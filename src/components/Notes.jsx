import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import './Notes.css';
import ErrorBoundary from './ErrorBoundary';

function Notes() {
  const { noteId } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [images, setImages] = useState([]); // Store multiple images
  const [newTag, setNewTag] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [copyTimeoutId, setCopyTimeoutId] = useState(null);
  const [tags, setTags] = useState(['AI', 'Technology']); // Example tags
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingImages, setDeletingImages] = useState(new Set());
  const [deleteError, setDeleteError] = useState('');
  const [deleteErrorTimeoutId] = useState(null);
  const [loadingImages, setLoadingImages] = useState(new Map());
  const [imageRetries, setImageRetries] = useState(new Map());
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryLoadingTimeoutId, setRetryLoadingTimeoutId] = useState(null);
  const MAX_RETRIES = 3;

  // Example note data (in a real app, this would come from a database)
  const note = {
    id: noteId,
    title: 'Introduction to AI',
    date: 'Jan 15, 2024',
    topic: 'AI',
    content: `Artificial Intelligence (AI) is revolutionizing how we interact with technology. Here are the key points from today's lecture:

1. Definition of AI
- Systems that can perform tasks that typically require human intelligence
- Includes learning, reasoning, problem-solving, perception, and language understanding

2. Types of AI
- Narrow AI (focused on specific tasks)
- General AI (human-level intelligence across tasks)
- Super AI (theoretical future AI surpassing human intelligence)

3. Applications
- Machine Learning
- Natural Language Processing
- Computer Vision
- Robotics`,
    summary: 'This lecture covered the fundamental concepts of AI, including its definition, types, and real-world applications.',
    keyPoints: [
      'Understanding AI fundamentals',
      'Different types of AI systems',
      'Current applications in industry',
      'Future potential and limitations'
    ],
    images: [] // Will store uploaded image URLs
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (deleteErrorTimeoutId) {
        clearTimeout(deleteErrorTimeoutId);
      }
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId);
      }
      if (retryLoadingTimeoutId) {
        clearTimeout(retryLoadingTimeoutId);
      }
    };
  }, [deleteErrorTimeoutId, copyTimeoutId, retryLoadingTimeoutId]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoadingImages(true);
        setLoadError('');

        // List all files in the note's folder
        const { data: files, error } = await supabase.storage
          .from('note-images')  // Fixed bucket name
          .list(`${noteId}`);

        if (error) throw error;

        if (files && files.length > 0) {
          const imageUrls = files.map(file => {
            const { data: { publicUrl } } = supabase.storage
              .from('note-images')  // Fixed bucket name
              .getPublicUrl(`${noteId}/${file.name}`);
            return publicUrl;
          });

          setImages(imageUrls);
        }
      } catch (error) {
        console.error('Error loading images:', error);
        setLoadError('Failed to load images. Please try again later.');
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [noteId]);

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Reset error state
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
      const filePath = `${noteId}/${fileName}`;

      const { error } = await supabase.storage
        .from('note-images')  // Fixed bucket name
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')  // Fixed bucket name
        .getPublicUrl(filePath);

      setImages(prevImages => [...prevImages, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl, index) => {
    try {
      setDeletingImages(prev => new Set([...prev, index]));
      setDeleteError('');

      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const filePath = `${noteId}/${urlParts[urlParts.length - 1]}`;

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('note-images')  // Fixed bucket name
        .remove([filePath]);

      if (error) throw error;

      // Remove from UI if deletion was successful
      setImages(prevImages => prevImages.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting image:', error);
      setDeleteError('Failed to delete image. Please try again.');
      setTimeout(() => setDeleteError(''), 3000);
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleImageLoad = (index) => {
    setLoadingImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    setImageRetries(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  const handleImageError = (index, imageUrl) => {
    const currentRetries = imageRetries.get(index) || 0;
    if (currentRetries < MAX_RETRIES) {
      // Retry loading the image
      setImageRetries(prev => {
        const newMap = new Map(prev);
        newMap.set(index, currentRetries + 1);
        return newMap;
      });
      // Force reload the image by adding a cache-busting parameter
      const img = document.querySelector(`#image-${index}`);
      if (img) {
        img.src = `${imageUrl}?retry=${currentRetries + 1}`;
      }
    } else {
      setLoadingImages(prev => {
        const newMap = new Map(prev);
        newMap.set(index, 'error');
        return newMap;
      });
    }
  };

  const retryLoadImage = (index, imageUrl) => {
    setLoadingImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    setImageRetries(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    // Force reload the image
    const img = document.querySelector(`#image-${index}`);
    if (img) {
      img.src = `${imageUrl}?retry=${Date.now()}`;
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      // Clear any existing timeout
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId);
        setCopyTimeoutId(null);
      }

      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      
      // Set new timeout and store its ID
      const timeoutId = setTimeout(() => {
        setCopySuccess('');
        setCopyTimeoutId(null);
      }, 2000);
      setCopyTimeoutId(timeoutId);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleDelete = (type) => {
    // Here you would implement the actual delete functionality
    console.log(`Deleting ${type}`);
    setShowDeleteConfirm(false);
  };

  const handleRetryLoading = () => {
    // Clear any existing timeout
    if (retryLoadingTimeoutId) {
      clearTimeout(retryLoadingTimeoutId);
      setRetryLoadingTimeoutId(null);
    }

    setIsLoadingImages(true);
    setLoadError('');

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      setIsLoadingImages(false);
      setLoadError('Loading timed out. Please try again.');
      setRetryLoadingTimeoutId(null);
    }, 10000); // 10 second timeout

    setRetryLoadingTimeoutId(timeoutId);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: note.title,
        text: `Check out my notes on ${note.title}:\n\n${note.summary}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="notes">
      <div className="container">
        <div className="notes-header">
          <div className="header-left">
            <Link to="/notes" className="btn btn-outline">← Back to Archive</Link>
            <h2>{note.title}</h2>
          </div>
          <div className="header-right">
            <span className="note-date">{note.date}</span>
            <Link to="/quiz" className="btn">Take Quiz</Link>
            <button className="btn">Export</button>
          </div>
        </div>

        <div className="notes-content">
          <div className="main-content card">
            <div className="content-header">
              <h3>Lecture Notes</h3>
              <div className="content-actions">
                <button 
                  className="btn btn-icon" 
                  onClick={() => copyToClipboard(note.content, 'Note')}
                  title="Copy note"
                >
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
                <button 
                  className="btn btn-icon btn-danger" 
                  onClick={() => setShowDeleteConfirm('note')}
                  title="Delete note"
                >
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="tags-section">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button onClick={() => handleDeleteTag(tag)} className="tag-delete">×</button>
                </span>
              ))}
              <form onSubmit={handleAddTag} className="add-tag-form">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="tag-input"
                />
                <button type="submit" className="btn btn-small">Add</button>
              </form>
            </div>

            <div className="note-text">
              {note.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="image-section">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
                disabled={isUploading}
              />
              <div className="upload-container">
                <label htmlFor="image-upload" className={`btn btn-upload ${isUploading ? 'uploading' : ''}`}>
                  <span className="btn-upload-content">
                    {isUploading ? (
                      <div className="spinner"></div>
                    ) : (
                      <svg viewBox="0 0 24 24" className="icon">
                        <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                      </svg>
                    )}
                    {isUploading ? 'Uploading...' : 'Add Image'}
                  </span>
                </label>
                {uploadError && <div className="upload-error">{uploadError}</div>}
                {deleteError && <div className="upload-error">{deleteError}</div>}
              </div>

              {isLoadingImages ? (
                <div className="images-loading">
                  <div className="spinner"></div>
                  <span>Loading images...</span>
                </div>
              ) : loadError ? (
                <div className="images-error">
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span>{loadError}</span>
                  <button 
                    className="btn btn-small retry-btn"
                    onClick={handleRetryLoading}
                    disabled={isLoadingImages}
                  >
                    {isLoadingImages ? (
                      <>
                        <div className="spinner spinner-small"></div>
                        <span>Retrying...</span>
                      </>
                    ) : (
                      'Retry Loading'
                    )}
                  </button>
                </div>
              ) : images.length > 0 ? (
                <div className="images-grid">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="image-preview">
                      <img 
                        id={`image-${index}`}
                        src={imageUrl} 
                        alt={`Note image ${index + 1}`}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index, imageUrl)}
                        style={{ opacity: loadingImages.get(index) === undefined ? 0 : 1 }}
                      />
                      {loadingImages.get(index) === 'error' ? (
                        <div className="image-error">
                          <svg viewBox="0 0 24 24" className="icon">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <span>Failed to load image</span>
                          <button 
                            className="btn btn-small retry-btn"
                            onClick={() => retryLoadImage(index, imageUrl)}
                          >
                            Retry
                          </button>
                        </div>
                      ) : loadingImages.get(index) === undefined && (
                        <div className="image-loading">
                          <div className="spinner"></div>
                          {imageRetries.get(index) > 0 && (
                            <span className="retry-count">
                              Retry {imageRetries.get(index)}/{MAX_RETRIES}
                            </span>
                          )}
                        </div>
                      )}
                      <button 
                        className={`image-delete-btn ${deletingImages.has(index) ? 'deleting' : ''}`}
                        onClick={() => handleDeleteImage(imageUrl, index)}
                        disabled={deletingImages.has(index)}
                        title="Delete image"
                      >
                        {deletingImages.has(index) ? (
                          <div className="spinner spinner-small"></div>
                        ) : (
                          <svg viewBox="0 0 24 24" className="icon">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images">
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span>No images uploaded yet</span>
                </div>
              )}
            </div>
          </div>

          <div className="side-content">
            <div className="summary-section card">
              <div className="section-header">
                <h3>AI Summary</h3>
                <div className="section-actions">
                  <button 
                    className="btn btn-icon" 
                    onClick={() => copyToClipboard(note.summary, 'Summary')}
                    title="Copy summary"
                  >
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </button>
                  <button 
                    className="btn btn-icon btn-danger" 
                    onClick={() => setShowDeleteConfirm('summary')}
                    title="Delete summary"
                  >
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p>{note.summary}</p>
            </div>

            <div className="key-points card">
              <h3>Key Points</h3>
              <ul>
                {note.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="actions card">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button className="btn">Edit Notes</button>
                <button className="btn" onClick={handleShare}>
               {/* <svg viewBox="0 0 24 24" className="icon"> <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/> </svg> */}
                  Share Notes
                </button>
                <button className="btn">Generate Flashcards</button>
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="delete-modal">
            <div className="delete-modal-content card">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this {showDeleteConfirm}?</p>
              <div className="delete-modal-actions">
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDelete(showDeleteConfirm)}
                >
                  Delete
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {copySuccess && (
          <div className="copy-notification">
            {copySuccess}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notes;
