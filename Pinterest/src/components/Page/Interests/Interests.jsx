import "./Interests.css";
import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import { signup, storeSession } from "../../../api/user";
import PageBackdrop from "../PageBackdrop";
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
        const data = await signup({
          ...pendingSignup,
          selectedInterests
        });

        storeSession(data);
      } catch (error) {
        console.error("Signup request failed:", error);
        alert(error.message || "Signup failed. Please try again.");
        return;
      }
    }

    navigate("/dashboard", {state:{selectedInterests}});
  };

  return (
    <div className="interests-page relative isolate">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />

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