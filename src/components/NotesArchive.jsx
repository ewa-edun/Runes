import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getUserNotes } from '../config/firebase';
import './NotesArchive.css';

function NotesArchive() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userNotes = await getUserNotes(auth.currentUser.uid);
        setNotes(userNotes);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleNoteClick = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const filteredAndSortedNotes = notes
    .filter(note => {
      if (!searchTerm) return true;
      return (
        note.title.toLowerCase().includes(searchTerm) ||
        note.topic?.toLowerCase().includes(searchTerm) ||
        note.teacher?.toLowerCase().includes(searchTerm) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'topic') {
        return (a.topic || '').localeCompare(b.topic || '');
      } else if (sortBy === 'teacher') {
        return (a.teacher || '').localeCompare(b.teacher || '');
      }
      return 0;
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-archive">
      <div className="container">
        <div className="archive-header">
          <h2>Notes Archive</h2>
          <div className="archive-controls">
            <input 
              type="search" 
              placeholder="Search notes..." 
              className="search-input" 
              value={searchTerm}
              onChange={handleSearch}
            />
            <select 
              className="sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="date">Sort by Date</option>
              <option value="topic">Sort by Topic</option>
              <option value="teacher">Sort by Teacher</option>
            </select>
            <Link to="/settings" className="btn btn-outline">Settings</Link>
            <Link to="/record" className="btn">New Recording</Link>
            <Link to="/profile" className="btn">Profile</Link>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {filteredAndSortedNotes.length === 0 ? (
          <div className="empty-state">
            <h3>No notes found</h3>
            <p>Start by creating your first note!</p>
            <Link to="/record" className="btn btn-primary">Create Note</Link>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredAndSortedNotes.map((note) => (
              <div 
                key={note.id} 
                className="note-card card" 
                onClick={() => handleNoteClick(note.id)}
              >
                <div className="note-header">
                  <h3>{note.title || 'Untitled Note'}</h3>
                  <span className="note-date">{formatDate(note.created_at)}</span>
                </div>
                {note.topic && (
                  <div className="note-topic">
                    <strong>Topic:</strong> {note.topic}
                  </div>
                )}
                {note.teacher && (
                  <div className="note-teacher">
                    <strong>Teacher:</strong> {note.teacher}
                  </div>
                )}

                <p className="note-preview">
                  {truncateText(note.note, 120) || 'No content available'}
                </p>
                
                <div className="note-footer">
                  <div className="note-tags">
                    {note.tags?.slice(0, 2).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                    {note.tags?.length > 2 && (
                      <span className="tag-more">+{note.tags.length - 2} more</span>
                    )}
                  </div>
                  <Link 
                    to={`/notes/${note.id}`} 
                    className="btn btn-outline btn-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesArchive
