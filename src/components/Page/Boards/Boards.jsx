import "./Boards.css";

function Boards({ boards = [] }) {
  return (
    <div className="boards-page">
      <h1>My Boards</h1>

      {boards.length > 0 ? (
        <div className="boards-grid">
          {boards.map((board) => (
            <div className="board-card" key={board.id}>
              <h2>{board.name}</h2>
              <p>{board.resources.length} resources</p>

              {board.resources.length > 0 && (
                <ul>
                  {board.resources.map((resource) => (
                    <li key={resource.id}>{resource.title}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No boards yet. Save a resource from the dashboard to get started.</p>
      )}
    </div>
  );
}

export default Boards;