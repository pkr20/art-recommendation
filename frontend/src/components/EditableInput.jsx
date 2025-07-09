import { useState } from 'react';

async function updateProfileInput(newInput) {
  //replace this part later with actual request to database
  return new Promise((resolve) => {
      resolve({ success: true });
  });
}
//component for user input in their profile
export default function EditableInput({ initialInput }) {
  const [input, setInput] = useState(initialInput);      // current displayed input
  const [tempInput, setTempInput] = useState(initialInput); // temporary editable input
  const [isEditing, setIsEditing] = useState(false);  // editing mode

  const [error, setError] = useState("");            
  const [loading, setLoading] = useState(false);      

  //save button to update the input   
  const handleSave = async () => {
    if (tempInput.trim() === "") {
      setError("Input cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const res = await updateProfileInput(tempInput);
      if (res.success) {
        setInput(tempInput);
        setIsEditing(false);
        setError("");
      } else {
        setError("Failed to update name.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } 
      setLoading(false);
  };

  //cancel button to reset the input to the original value
  const handleCancel = () => {
    setTempInput(input);
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="profile-input-editor">
      {isEditing ? (
        <>
          <input
            type="text"
            value={tempInput}
            onChange={(e) => setTempInput(e.target.value)}
          />
          <button className='profile-btn' onClick={handleSave} disabled={loading} >
            {loading ? "Saving..." : "Save"}
          </button>
          <button className='profile-btn' onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          {error && <p className="error" style={{color: 'red', fontSize: '12px'}} >{error}</p>}
        </>
      ) : (
        <>
          <h2>{input}</h2>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
}
