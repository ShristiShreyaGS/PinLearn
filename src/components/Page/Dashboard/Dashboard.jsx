import "./Dashboard.css";
import ResourceCard from "../../ResourceCard/ResourceCard";
import { useLocation } from "react-router-dom";
import { useState } from "react";


function Dashboard() {
  const routerData=useLocation();
  const selectedInterests=routerData.state?.selectedInterests||[];
  const [savedResources, setSavedResources] = useState([]);
  const saveResource = (resource) => {

  const alreadySaved = savedResources.some(
    (saved) => saved.id === resource.id
  );

  if (alreadySaved) {
    return;
  }

  setSavedResources((previousResources) => [
    ...previousResources,
    resource
  ]);

};
  const resources = [
  {
    id: 1,
    topic: "React",
    type: "Video",
    title: "React Hooks Explained",
    description: "Learn the basics of React Hooks.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 2,
    topic: "React",
    type: "Article",
    title: "Understanding React Components",
    description: "A beginner-friendly guide to React components.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 3,
    topic: "React",
    type: "Repository",
    title: "React Projects",
    description: "Explore projects built using React.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 4,
    topic: "React",
    type: "Project",
    title: "React Dashboard",
    description: "A dashboard project built with React.",
    image: "https://placehold.co/600x400"
  },

  {
    id: 5,
    topic: "AI",
    type: "Video",
    title: "Introduction to AI",
    description: "Understand the basics of Artificial Intelligence.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 6,
    topic: "AI",
    type: "Article",
    title: "How AI Works",
    description: "An introduction to modern AI concepts.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 7,
    topic: "AI",
    type: "Repository",
    title: "Awesome AI Projects",
    description: "Explore interesting AI projects.",
    image: "https://placehold.co/600x400"
  },

  {
    id: 8,
    topic: "Playwright",
    type: "Video",
    title: "Playwright Basics",
    description: "Get started with Playwright testing.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 9,
    topic: "Playwright",
    type: "Article",
    title: "Understanding Playwright Fixtures",
    description: "Learn about reusable Playwright fixtures.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 10,
    topic: "Playwright",
    type: "Repository",
    title: "Playwright Examples",
    description: "Explore Playwright automation examples.",
    image: "https://placehold.co/600x400"
  }
];
const interestsToRender = selectedInterests.length
  ? selectedInterests
  : [...new Set(resources.map((resource) => resource.topic))];
  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <h2>PinLearn</h2>

        <nav>
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/boards">My Boards</a>
        </nav>

        <button>Profile</button>

      </header>

<main className="dashboard-content">

  <div className="welcome-section">

    <p className="small-heading">
      YOUR PERSONALIZED FEED
    </p>

    <h1>
      Learn something interesting today.
    </h1>

    <p>
      A collection of things worth exploring,
      based on what you're into.
    </p>

  </div>


  <div className="interest-pills">

    {selectedInterests.map((interest) => (
      <span key={interest}>
        {interest}
      </span>
    ))}

  </div>
  {/* resources below */}
  {interestsToRender.map((interest) => {

  const interestResources = resources.filter(
    (resource) => resource.topic === interest
  );

  const videos = interestResources.filter(
    (resource) => resource.type === "Video"
  );

  const articles = interestResources.filter(
    (resource) => resource.type === "Article"
  );

  const repositories = interestResources.filter(
    (resource) => resource.type === "Repository"
  );

  const projects = interestResources.filter(
    (resource) => resource.type === "Project"
  );


  return (
    <section key={interest}>

      <div className="section-heading">
        <h2>{interest}</h2>
        <button>See all</button>
      </div>


      {/* VIDEOS */}

      {videos.length > 0 && (
        <>
          <h3>Videos</h3>

          <div className="content-grid">

            {videos.map((resource) => (
              <ResourceCard
  key={resource.id}
  resource={resource}
  onSave={saveResource}
  isSaved={savedResources.some(
    (saved) => saved.id === resource.id
  )}
/>
            ))}

          </div>
        </>
      )}


      {/* ARTICLES */}

      {articles.length > 0 && (
        <>
          <h3>Articles</h3>

          <div className="content-grid">

            {articles.map((resource) => (
             <ResourceCard
  key={resource.id}
  resource={resource}
  onSave={saveResource}
  isSaved={savedResources.some(
    (saved) => saved.id === resource.id
  )}
/>
            ))}

          </div>
        </>
      )}


      {/* REPOSITORIES */}

      {repositories.length > 0 && (
        <>
          <h3>Repositories</h3>

          <div className="content-grid">

            {repositories.map((resource) => (
              <ResourceCard
  key={resource.id}
  resource={resource}
  onSave={saveResource}
  isSaved={savedResources.some(
    (saved) => saved.id === resource.id
  )}
/>
            ))}

          </div>
        </>
      )}


      {/* PROJECTS */}

      {projects.length > 0 && (
        <>
          <h3>Projects</h3>

          <div className="content-grid">

            {projects.map((resource) => (
              <ResourceCard
  key={resource.id}
  resource={resource}
  onSave={saveResource}
  isSaved={savedResources.some(
    (saved) => saved.id === resource.id
  )}
/>
            ))}

          </div>
        </>
      )}

    </section>
  );
})}
</main>
    </div>
  );
}

export default Dashboard;