import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getNoteById, updateNote, deleteNote } from '../config/firebase';
import { supabase } from '../config/supabase';
import './Notes.css';

function Notes() {
  // Router hooks
  const { id: noteId } = useParams();
     console.log("Note ID from URL params:", noteId);

  const navigate = useNavigate();
  
  // All state declarations at the top
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    note: '',
    summary: '',
    key_points: '',
    topic: '',
    teacher: '',
    tags: '',
    image_url: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ export_method: 'pdf' });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [images, setImages] = useState([]);
  const [_previewImage, setPreviewImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deletingImages, setDeletingImages] = useState(new Set());
  const [deleteError, setDeleteError] = useState('');
  const [loadingImages, setLoadingImages] = useState(new Map());
  const [imageRetries, setImageRetries] = useState(new Map());
  const [deleteErrorTimeoutId, setDeleteErrorTimeoutId] = useState(null);
  const [copyTimeoutId, setCopyTimeoutId] = useState(null);
  const [retryLoadingTimeoutId, setRetryLoadingTimeoutId] = useState(null);
  
  // Constants
  const MAX_RETRIES = 3;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (deleteErrorTimeoutId) clearTimeout(deleteErrorTimeoutId);
      if (copyTimeoutId) clearTimeout(copyTimeoutId);
      if (retryLoadingTimeoutId) clearTimeout(retryLoadingTimeoutId);
    };
  }, [deleteErrorTimeoutId, copyTimeoutId, retryLoadingTimeoutId]);

  // Define fetchNote before any effects that use it
  const fetchNote = useCallback(async () => {
    if (!noteId) {
      console.log("No noteId provided");
      setError('No note ID provided');
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      console.log("Fetching note with ID:", noteId);
      const noteData = await getNoteById(noteId);
      
      console.log("Note data returned:", noteData);

      if (!noteData) {
        console.log("Note not found in Database");
        setError('Note not found');
        setLoading(false);
        return null;
      }

      return noteData;
    } catch (err) {
      console.error('Error fetching note:', err);
      setError('Failed to load note. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  // Load images function
  const loadImages = useCallback(async (id) => {
    if (!id) return;
    
    try {
      setIsLoadingImages(true);
      setLoadError('');
      
      // List all files in the note-images bucket
      const { data: files, error } = await supabase.storage
        .from('note-images')
        .list();

      if (error) throw error;

      if (files && files.length > 0) {
        // Filter files that belong to this note
        const noteFiles = files.filter(file => file.name.startsWith(id) || file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.jpeg') || file.name.endsWith('.gif'));
        
        const imageUrls = [];
        
        // Get public URLs for each file
        for (const file of noteFiles) {
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('note-images')
              .getPublicUrl(file.name);
              
            // Verify the image exists and is accessible
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = () => {
                imageUrls.push(publicUrl);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = publicUrl;
            });
          } catch (err) {
            console.error('Error processing image:', file.name, err);
          }
        }
        
        setImages(prev => [...new Set([...prev, ...imageUrls])]);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setLoadError('Failed to load images. Please try again later.');
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // Main data loading effect
  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setExportFormat(parsedSettings.export_method || 'pdf');
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  // Save export method to settings when it changes
  useEffect(() => {
    // Only update if the export method has actually changed
    if (settings.export_method !== exportFormat) {
      const newSettings = { ...settings, export_method: exportFormat };
      setSettings(newSettings);
      localStorage.setItem('settings', JSON.stringify(newSettings));
    }
  }, [exportFormat, settings]); 

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        // Only update export format if it's different from current
        if (parsedSettings.export_method && parsedSettings.export_method !== exportFormat) {
          setExportFormat(parsedSettings.export_method);
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, [exportFormat]);

  useEffect(() => {
    const loadNoteData = async () => {
      if (!noteId) {
        setLoading(false);
        return;
      }
      
      // Check if user is authenticated
    if (!auth.currentUser) {
      setError('You must be logged in to view notes');
      setLoading(false);
      return;
    }

      const noteData = await fetchNote();
      
      if (!noteData) {
        // Error already set in fetchNote
        return;
      }

      setNote(noteData);
      
      // Set form data
      setFormData({
        title: noteData.title || '',
        note: noteData.note || '',
        summary: noteData.summary || '',
        key_points: noteData.key_points || '',
        topic: noteData.topic || '',
        teacher: noteData.teacher || '',
        tags: noteData.tags ? noteData.tags.join(', ') : '',
        image_url: noteData.image_url || ''
      });
      
      // Set tags
      if (noteData.tags && Array.isArray(noteData.tags)) {
        setTags(noteData.tags);
      }
      
      // Load images if available
      if (noteData.image_url) {
        setImages([noteData.image_url]);
        setPreviewImage(noteData.image_url);
      }
      
      // After data is set, load images
      await loadImages(noteId);
      
      // Set loading to false after everything is loaded
      setLoading(false);
    };

    loadNoteData();
  }, [fetchNote, noteId, loadImages]);

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
      const fileName = `${noteId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      setImages(prevImages => [...prevImages, publicUrl]);
      
      // Clear the file input
      e.target.value = null;
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
        .from('note-images')
        .remove([filePath]);

      if (error) throw error;

      // Remove from UI if deletion was successful
      setImages(prevImages => prevImages.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting image:', error);
      setDeleteError('Failed to delete image. Please try again.');
      
      // Clear error after 3 seconds
      const timeoutId = setTimeout(() => setDeleteError(''), 3000);
      setDeleteErrorTimeoutId(timeoutId);
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
    loadImages();
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (noteId) {
        await updateNote(noteId, {
          ...formData,
          tags: [...new Set([...tags, ...formData.tags.split(',').map(t => t.trim()).filter(Boolean)])]
        });
        setEditing(false);
      } else {
        navigate('/notes');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = handleSave;

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const updatedTags = [...tags, trimmedTag];
      setTags(updatedTags);
      setFormData(prev => ({
        ...prev,
        tags: updatedTags.join(', ')
      }));
      setNewTag('');
      
      // Update the note in the database
      if (noteId) {
        updateNote(noteId, {
          ...formData,
          tags: updatedTags
        }).catch(console.error);
      }
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    const updatedTags = tags.filter(tag => tag !== tagToDelete);
    setTags(updatedTags);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags.join(', ')
    }));
    
    // Update the note in the database
    if (noteId) {
      try {
        await updateNote(noteId, {
          ...formData,
          tags: updatedTags
        });
      } catch (error) {
        console.error('Error updating tags:', error);
        // Revert UI if update fails
        setTags(tags);
      }
    }
  };

  const handleExport = async (format) => {
    try {
      setSaving(true);
      
      // In a real implementation, you would generate the export here
      // For now, we'll just show a success message
      console.log(`Exporting to ${format}`);
      
      // Example of what the export might look like
      let content = '';
      let mimeType = '';
      let fileExtension = '';
      
      switch(format) {
        case 'pdf':
          content = `PDF Export for: ${note?.title}\n\n${note?.note}`;
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          // In a real app, you would use a PDF generation library here
          break;
          
        case 'markdown':
          content = `# ${note?.title}\n\n${note?.note}`;
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
          
        case 'google-docs':
          // This would typically open a new window/tab with Google Docs
          window.open(`https://docs.google.com/document/create?title=${encodeURIComponent(note?.title || 'Untitled')}`, '_blank');
          setShowExportModal(false);
          return;
          
        default:
          throw new Error('Unsupported export format');
      }
      
      // For PDF and Markdown, create a download
      if (format !== 'google-docs') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note?.title || 'note'}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export note. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    if (!auth.currentUser) {
      setError('You must be logged in to delete notes');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteNote(noteId);
      navigate('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/notes')} className="btn btn-primary">
          Back to Notes
        </button>
      </div>
    );
  }

  if (!note && !loading) {
    return (
      <div className="empty-state">
        <h2>Note not found</h2>
        <p>The requested note could not be found or you don't have permission to view it.</p>
        <button onClick={() => navigate('/notes')} className="btn btn-primary">
          Back to Notes
        </button>
      </div>
    );
  }

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Export modal component
  const ExportModal = ({ onClose, onExport }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Export Note</h3>
        <p>Choose export format:</p>
        <div className="export-options">
          <div 
            className={`export-option ${exportFormat === 'pdf' ? 'selected' : ''}`}
            onClick={() => setExportFormat('pdf')}
          >
            <svg viewBox="0 0 24 24" className="icon">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H8v-7h2v7zm-1-9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9 9h-1.5v-2.86c0-1.31-1.02-2.5-2.5-2.5s-2.5 1.19-2.5 2.5V17h-1.5v-7h1.5v1.5c.55-1.22 1.76-2 3-2 1.93 0 3.5 1.57 3.5 3.5V17z"/>
            </svg>
            <span>PDF</span>
            {exportFormat === 'pdf' && (
              <div className="export-check">
                <svg viewBox="0 0 24 24" className="check-icon">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </div>
          
          <div 
            className={`export-option ${exportFormat === 'markdown' ? 'selected' : ''}`}
            onClick={() => setExportFormat('markdown')}
          >
            <svg viewBox="0 0 24 24" className="icon">
              <path d="M20.56 18H3.44C2.65 18 2 17.33 2 16.5v-9C2 6.67 2.65 6 3.44 6h17.12c.79 0 1.44.67 1.44 1.5v9c0 .83-.65 1.5-1.44 1.5zM3.44 7.5c-.24 0-.44.2-.44.5v9c0 .28.2.5.44.5h17.12c.24 0 .44-.22.44-.5v-9c0-.28-.2-.5-.44-.5H3.44z"/>
              <path d="M5 12h2v5H5zM10.29 12l-1.71 2.5 1.71 2.5h1.42l-1.71-2.5 1.71-2.5zM15 12h2v5h-2z"/>
            </svg>
            <span>Markdown</span>
            {exportFormat === 'markdown' && (
              <div className="export-check">
                <svg viewBox="0 0 24 24" className="check-icon">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </div>
          
          <div 
            className={`export-option ${exportFormat === 'google-docs' ? 'selected' : ''}`}
            onClick={() => setExportFormat('google-docs')}
          >
            <svg viewBox="0 0 24 24" className="icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 7h2v5h-2z"/>
            </svg>
            <span>Google Docs</span>
            {exportFormat === 'google-docs' && (
              <div className="export-check">
                <svg viewBox="0 0 24 24" className="check-icon">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
        
        <div className="current-export-method">
          <p>Current Export Method: <strong>{exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)}</strong></p>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => onExport(exportFormat)}
            disabled={saving}
          >
            {saving ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="notes">
      <div className="container">
        <div className="notes-header">
          <div className="header-left">
            <Link to="/notes" className="btn btn-outline">← Back to Archive</Link>
            <h2>{note.title}</h2>
          </div>
          <div className="header-right">
            <span className="note-date">
              {formatDate(note.updated_at || note.created_at)}
            </span>
            <Link to={`/quiz/${note.id}`} className="btn">Take Quiz</Link>
            <button 
              className="btn"
              onClick={() => setShowExportModal(true)}
              disabled={loading || saving}
            >
              Export
            </button>
          </div>
        </div>
        
        {showExportModal && (
          <ExportModal
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
          />
        )}

        <div className="notes-content">
          <div className="main-content card">
            <div className="content-header">
              <h3>Lecture Notes</h3>
              <div className="content-actions">
                <button 
                  className="btn btn-icon" 
                  onClick={() => copyToClipboard(note.note, 'Note')}
                  title="Copy note"
                >
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
                <button 
                  className="btn btn-icon" 
                  onClick={() => setEditing(!editing)}
                  title={editing ? 'Cancel' : 'Edit'}
                >
                  {editing ? (
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  )}
                </button>
                <button 
                  className="btn btn-icon btn-danger" 
                  onClick={() => setShowDeleteConfirm(true)}
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
              {editing ? (
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="10"
                  className="note-edit"
                />
              ) : (
                note.note.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              )}
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
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete summary"
                  >
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              {editing ? (
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows="5"
                  className="summary-edit"
                />
              ) : (
                <p>{note.summary || 'No summary available'}</p>
              )}
            </div>

            <div className="key-points card">
              <h3>Key Points</h3>
              {editing ? (
                <textarea
                  name="key_points"
                  value={formData.key_points}
                  onChange={handleChange}
                  rows="8"
                  className="key-points-edit"
                  placeholder="Enter key points, one per line"
                />
              ) : (
                <ul>
                  {note.key_points && note.key_points.length > 0 ? (
                    note.key_points.split('\n').map((point, i) => (
                      <li key={i}>{point}</li>
                    ))
                  ) : (
                    <li>No key points available</li>
                  )}
                </ul>
              )}
            </div>

            <div className="actions card">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button 
                  className="btn" 
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? 'Cancel' : 'Edit Notes'}
                </button>
                {editing ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                ) : (
                  <>
                    <button className="btn" onClick={handleShare}>
                      Share Notes
                    </button>
                    <button className="btn">Generate Flashcards</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content card">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={loading || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
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
  );
}

export default Notes;
