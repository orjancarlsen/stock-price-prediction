import React from "react";
import "./LoadingAnimation.css";
import rocketImg from "../assets/rocket.jpg";

const LoadingAnimation = () => {
  return (
    <div className="loading-container">
      <div className="animation-wrapper">
        <svg className="graph-svg" viewBox="0 0 600 300">
          {/* Zigzag stock path */}
          {/* <path
            id="graph-path"
            className="line-path"
            d="
              M50,250
              L200,120
              L250,180
              L400,50
              L450,110
              L600,-20
            "
          /> */}

          {/* Straight line path for the rocket */}
          <path
            id="rocket-path"
            d="M0,250 L550,-20"
            fill="none"
          />

          {/* Rocket moves in a straight line */}
          <image
            href={rocketImg}
            width="48"
            height="48"
            className="rocket"
          >
            <animateMotion
              dur="1.0s"
              repeatCount="indefinite"
            >
              <mpath xlinkHref="#rocket-path" />
            </animateMotion>
          </image>
        </svg>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default LoadingAnimation;
