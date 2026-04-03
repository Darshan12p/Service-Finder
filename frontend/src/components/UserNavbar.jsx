import { useNavigate } from "react-router-dom";


const Navbar = () => {
        const navigate = useNavigate();
  const handleLogout = () => {
    // remove auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // if you stored user data

    // redirect to home
    navigate("/");
  };
  return (
    <nav className="flex items-center justify-between px-10 py-4 border-b">
      <h1 className="text-2xl font-bold text-indigo-600">Service Finder</h1>

      <div className="hidden md:flex gap-8 text-gray-600">
        <button onClick={() => navigate("/")}className="cursor-pointer hover:text-indigo-600">Home</button>
        <button onClick={() => navigate("/services")}className="cursor-pointer hover:text-indigo-600">Services</button>
        <button onClick={() => navigate("/contact")} className="cursor-pointer hover:text-indigo-600">Contact Us</button>
      </div>

      <button onClick={handleLogout}
        className="bg-red-600 text-white px-5 py-2 rounded-lg">
        Logout
      </button>
      
    </nav>
  );
};

export default Navbar;
