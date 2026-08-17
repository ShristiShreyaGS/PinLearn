import React, { useEffect, useState } from "react";
import "./Profile.css";
import { getProfile, updateProfile } from "../../../api/user";

const interests = [
  "React",
  "JavaScript",
  "AI",
  "Playwright",
  "DSA",
  "Node.js",
  "Python",
  "Angular",
  "DevOps"
];

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [form, setForm] = useState({ name: "", bio: "", selectedInterests: [] });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          selectedInterests: data.selectedInterests || []
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        setError(error.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!profile) {
    return <div>No profile found.</div>;
  }

  const startEditing = () => {
    setForm({
      name: profile.name || "",
      bio: profile.bio || "",
      selectedInterests: profile.selectedInterests || []
    });
    setSaveMessage("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setSaveMessage("");
    setIsEditing(false);
  };

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      selectedInterests: current.selectedInterests.includes(interest)
        ? current.selectedInterests.filter((item) => item !== interest)
        : [...current.selectedInterests, interest]
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      const updatedProfile = await updateProfile(form);
      setProfile(updatedProfile);
      localStorage.setItem("user", JSON.stringify(updatedProfile));
      setIsEditing(false);
      setSaveMessage("Profile updated successfully.");
    } catch (error) {
      setSaveMessage(error.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button className="profile-edit-button" type="button" onClick={startEditing}>
            Edit profile
          </button>
        )}
      </div>

      {saveMessage && <p className="profile-save-message">{saveMessage}</p>}

      {isEditing ? (
        <form className="profile-section profile-form" onSubmit={handleSave}>
          <h2>Edit Personal Information</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={80}
            />
          </label>
          <label>
            Email
            <input value={profile.email} readOnly />
          </label>
          <label>
            Bio
            <textarea
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              maxLength={300}
              rows={4}
            />
          </label>
          <div className="profile-form-actions">
            <button className="profile-cancel-button" type="button" onClick={cancelEditing}>
              Cancel
            </button>
            <button className="profile-save-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-section">
          <h2>Personal Information</h2>

          <p>
            <strong>Name:</strong>{" "}
            {profile.name || "Not added"}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {profile.email}
          </p>

          <p>
            <strong>Bio:</strong>{" "}
            {profile.bio || "Not added"}
          </p>
        </div>
      )}

      <div className="profile-section">
        <h2>My Interests</h2>

        {isEditing ? (
          <div className="profile-interest-options">
            {interests.map((interest) => (
              <button
                className={form.selectedInterests.includes(interest) ? "interest-option selected" : "interest-option"}
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                aria-pressed={form.selectedInterests.includes(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        ) : profile.selectedInterests?.length > 0 ? (
          <div className="interests-list">
            {profile.selectedInterests.map((interest) => (
              <span
                className="interest-tag"
                key={interest}
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p>No interests selected yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;