import "./Interests.css";
import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
function Interests() {
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
  
  const[selectedInterests,setSelectedInterests]=useState([]);
  const location = useLocation();
  const navigate=useNavigate();
  const handleInterestClick=(interest)=>{
    if(selectedInterests.includes(interest)){
        setSelectedInterests(
            selectedInterests.filter((item)=>item!==interest)
        
    );
    }
    else{
        setSelectedInterests([
            ...selectedInterests,interest
        ]);
    }
  };

  const handleContinue = async () => {
    if (location.state?.isNewUser) {
      const pendingSignup = location.state?.pendingSignup;

      if (!pendingSignup?.email || !pendingSignup?.password) {
        alert("Signup session expired. Please create your account again.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...pendingSignup,
            selectedInterests
          })
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : null;
        if (!response.ok) {
          alert(data?.message || "Signup failed");
          return;
        }

        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Signup request failed:", error);
        alert("Signup failed. Please try again.");
        return;
      }
    }

    navigate("/dashboard", {state:{selectedInterests}});
  };

  return (
    <div className="interests-page">

      <h1>What interests you?</h1>

      <p>
        Choose at least 3 topics to personalize your PinLearn feed.
      </p>

      <div className="interest-grid">

        {interests.map((interest) => (
          <button key={interest}
            onClick={()=>handleInterestClick(interest)}
            className={selectedInterests.includes(interest)?"interest-card selected":"interest-card"}
            >
                {interest}
          </button>
        ))}

      </div>

      <p>{selectedInterests.length} of 3 selected</p>

      <button className="continue-button" disabled={selectedInterests.length<3}
      onClick={handleContinue}>
        Continue
      </button>

    </div>
  );
}

export default Interests;