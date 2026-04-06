import React from 'react'
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import PopularServices from "./components/PopularServices";
import JoinUs from "./components/JoinUs";
import Footer from "./components/Footer";
import AllService from "./components/Allservice";


const Home = () => {
  return (
    <div className='bg-linear-to-br from-indigo-100 '>
      <Hero />
      <Categories />
      <PopularServices />
      <AllService/>
      <JoinUs />
      
    </div>
  )
}

export default Home
