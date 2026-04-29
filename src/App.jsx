import { useState } from 'react'

import './App.css'

function App() {
  return (

    <>
      <header className="top-nav">
        <div className="logo">
          <h1>StreamSync</h1>
        </div>
        <div className="nav-button">
          <button id="LoginBtn">Login</button>
          <button id="SignupBtn">Sign Up</button>
        </div>

      </header>
      <div className="container">
        <h1>Welcome to StreamSync</h1>
        <p>StreamSync is your ultimate solution for synchronizing video playback across multiple devices. Whether you're watching a movie with friends or hosting a virtual watch party, StreamSync ensures everyone stays in sync.</p>

      </div>

      <div style={{ height: "2000px" }}>

      </div>
    </>

  )
}

export default App
