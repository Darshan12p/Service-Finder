// src/components/User.jsx
import Hero from "./Hero";
import Categories from "./Categories";
import PopularServices from "./PopularServices";
import AllService from "./Allservice";
import JoinUs from "./JoinUs";

export default function User() {
  return (
    <div>
      <Hero />
      <Categories />
      <PopularServices />
      <AllService />
      <JoinUs />
    </div>
  );
}
