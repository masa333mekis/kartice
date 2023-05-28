import React from "react"
import "./App.css"
import { Routes, Route,Navigate } from "react-router-dom"
import Main from "./Main"
import Register from "./pages/Register/Register"
import Login from "./pages/Login/Login"
import Deck from "./pages/Deck/Deck"
import Statistics from "./pages/Statistics"
import Group from "./pages/Group"
import Collection from "./pages/Collection"
import StatisticsPage from "./pages/StatisticsPage"



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to='/login'/>}/>
      <Route path="/decks" element={<Deck/>}/>
      <Route path="/decks/:id" element={<Main />} />
      <Route path="/decks/:id/:groupId" element={<Main />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/collection" element={<Collection/>}/>
      <Route path="/decks/:id/statistics" element={<Statistics/>}/>
      <Route path="/decks/:id/statistics/:groupId" element={<Statistics/>}/>
      <Route path="/groups/:id" element={<Group/>}/>
      <Route path="/decks/:id/statisticprev" element={<StatisticsPage/>}/>
      <Route path="/decks/:id/statisticprev/:groupId" element={<StatisticsPage/>}/>
    </Routes>
  )
}
