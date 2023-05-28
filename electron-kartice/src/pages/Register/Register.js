import React, { useState, useEffect } from "react"
import "./styles.css"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
const { ipcRenderer } = window.require('electron');

export default function Register() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [isDark,setIsDark]=useState(window.matchMedia("(prefers-color-scheme: dark)").matches)


  const handleChange = (e) => {
    const key = e.target.name
    const value = e.target.value
    setUser({
      ...user,
      [key]: value,
    })
  }

  useEffect(() => {
    localStorage.removeItem("token")
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await axios.post("http://localhost:3002/register", { ...user })
    if (!result.data.error) {
      const notificationData = {
        title: 'Login successful!',
        body: 'You have successfully logged in.'
      };
      ipcRenderer.send('show-register', notificationData);
      navigate("/login")
    } else {
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
      navigate("/register")
    }
    //console.log(result)
  }
  return (
    <div className={`main-container ${isDark?'dark dark-text':'light light-text'}`}>
      <form onSubmit={handleSubmit}>
        <h1>Register</h1>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          onChange={handleChange}
          name="username"
          id="username"
        />
        <label htmlFor="email">Email</label>
        <input type="email" onChange={handleChange} name="email" id="email" />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          onChange={handleChange}
          name="password"
          id="password"
        />
        <input id="register-btn" type="submit" value="Register" />
        <Link to="/login" className={`${isDark?'link-tag-dark':'link-tag-light'}`}>
          Login
        </Link>
      </form>
    </div>
  )
}
