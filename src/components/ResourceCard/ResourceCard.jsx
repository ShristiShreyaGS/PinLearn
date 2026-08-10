import "./ResourceCard.css";

function ResourceCard({ resource,onSave,isSaved }) {

  return (
    <div className="resource-card">

      <div className="resource-image">
        <img
          src={resource.image}
          alt={resource.title}
        />
      </div>

      <div className="resource-info">

        <span className="resource-type">
          {resource.type}
        </span>

        <h3>{resource.title}</h3>

        <p>{resource.description}</p>

        <div className="resource-actions">
          <button>View</button>
          <button
  onClick={() => onSave(resource)}
  disabled={isSaved}
>
  {isSaved ? "Saved ✓" : "Save"}
</button>
        </div>

      </div>

    </div>
  );
}

export default ResourceCard;