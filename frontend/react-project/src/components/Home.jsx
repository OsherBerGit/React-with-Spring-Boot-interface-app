import React from 'react';
import axios from 'axios';

const Home = () => {

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/logout'); // fix here
      sessionStorage.setItem("accessToken", response.data.accessToken);
      sessionStorage.setItem("refreshToken", response.data.refreshToken);
      console.log("Login successful");
      // Redirect to login page
    } catch (err) {
      setError("Logout failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <>
        <h1>Welcome to the Home Page</h1>
        <button onClick={handleLogin}>Logout</button>
    </>
  );
};

export default Home;