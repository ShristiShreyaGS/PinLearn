import "./ResourceCard.css";

function ResourceCard({ resource,onSave,isSaved }) {
  const imageSrc = resource.thumbnail || resource.image;
  const meta = resource.channel || resource.source;

  return (
    <div className="resource-card">

      <div className="resource-image">
        <img
          src={imageSrc}
          alt={resource.title}
        />
      </div>

      <div className="resource-info">

        <span className="resource-type">
          {resource.type}
        </span>

        <h3>{resource.title}</h3>

        <p>{resource.description}</p>

        {meta && <p>{meta}</p>}

        <div className="resource-actions">
          <button
            onClick={() => {
              if (resource.url) {
                window.open(resource.url, "_blank", "noopener,noreferrer");
              }
            }}
          >
            View
          </button>
          <button
  onClick={() => onSave && onSave(resource)}
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