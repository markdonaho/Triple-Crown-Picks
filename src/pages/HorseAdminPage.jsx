import React, { useState, useEffect } from 'react';

// TODO: Fetch horses from Firestore
// TODO: Implement Add/Edit/Delete horse logic
// TODO: Implement associating horses with races

function HorseAdminPage() {
  const [horses, setHorses] = useState([]); // Placeholder
  const [loading, setLoading] = useState(false); // Placeholder
  const [error, setError] = useState(null); // Placeholder

  // Placeholder for form state
  const [newHorseName, setNewHorseName] = useState('');
  const [editHorseId, setEditHorseId] = useState(null);
  const [editHorseName, setEditHorseName] = useState('');

  // useEffect(() => {
  //   // Fetch horses
  // }, []);

  const handleAddHorse = (e) => {
    e.preventDefault();
    console.log('Adding horse:', newHorseName);
    // TODO: Add Firestore logic
    setNewHorseName('');
  };

  const handleEditHorse = (horse) => {
    setEditHorseId(horse.id);
    setEditHorseName(horse.name);
  };

  const handleUpdateHorse = (e) => {
    e.preventDefault();
    console.log('Updating horse', editHorseId, 'to', editHorseName);
    // TODO: Add Firestore update logic
    setEditHorseId(null);
    setEditHorseName('');
  };

  const handleDeleteHorse = (horseId) => {
    if (window.confirm('Are you sure you want to delete this horse?')) {
      console.log('Deleting horse:', horseId);
      // TODO: Add Firestore delete logic
    }
  };

  if (loading) return <p>Loading horses...</p>;
  if (error) return <p>Error loading horses: {error.message}</p>;

  return (
    <div>
      <h1>Manage Horses</h1>

      {/* Add Horse Form */}
      <form onSubmit={handleAddHorse} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newHorseName}
          onChange={(e) => setNewHorseName(e.target.value)}
          placeholder="New horse name"
          required
        />
        <button type="submit">Add Horse</button>
      </form>

      {/* Edit Horse Form (conditional) */}
      {editHorseId && (
        <form onSubmit={handleUpdateHorse} style={{ marginBottom: '1rem', border: '1px solid blue', padding: '1rem' }}>
          <h4>Editing: {editHorseName}</h4>
          <input
            type="text"
            value={editHorseName}
            onChange={(e) => setEditHorseName(e.target.value)}
            required
          />
          <button type="submit">Update Name</button>
          <button type="button" onClick={() => setEditHorseId(null)}>Cancel</button>
           {/* TODO: Add race association UI here */}
        </form>
      )}

      {/* Horse List */}
      <h2>Existing Horses</h2>
      {horses.length === 0 ? (
        <p>No horses added yet.</p>
      ) : (
        <ul>
          {horses.map(horse => (
            <li key={horse.id}>
              {horse.name}
              <button onClick={() => handleEditHorse(horse)} style={{ marginLeft: '1rem' }}>Edit</button>
              <button onClick={() => handleDeleteHorse(horse.id)} style={{ marginLeft: '0.5rem' }}>Delete</button>
              {/* TODO: Display associated races */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HorseAdminPage; 