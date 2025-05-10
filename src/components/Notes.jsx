import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../config/supabase';
import './Notes.css';

function Notes() {
  const { noteId } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tags, setTags] = useState(['AI', 'Technology']); // Example tags
  const [newTag, setNewTag] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

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

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${noteId}/${fileName}`;

      const { error } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      setSelectedImage(publicUrl);
      // Here you would update the note in your database with the new image URL
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
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
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" className="btn">
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                </svg>
                Add Image
              </label>
              {selectedImage && (
                <div className="image-preview">
                  <img src={selectedImage} alt="Uploaded content" />
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
                <button className="btn">Share Notes</button>
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
