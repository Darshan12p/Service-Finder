// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getCategoriesApi } from "../services/api";

// export default function Categories() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [cats, setCats] = useState([]);

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await getCategoriesApi();
//         setCats(res.data.items || res.data.categories || []);
//       } catch (e) {
//         console.log(e);
//         setCats([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-5xl mx-auto bg-white border rounded-3xl p-6 shadow-sm">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h1 className="text-2xl font-extrabold text-gray-900">Categories</h1>
//             <p className="text-gray-600 mt-1">Browse all service categories</p>
//           </div>
//           <button
//             onClick={() => navigate(-1)}
//             className="px-4 py-2 rounded-xl border font-semibold hover:bg-gray-50"
//           >
//             Back
//           </button>
//         </div>

//         <div className="mt-6">
//           {loading ? (
//             <div className="p-4 border rounded-2xl bg-gray-50">Loading...</div>
//           ) : cats.length === 0 ? (
//             <div className="p-4 border rounded-2xl bg-gray-50">No categories found.</div>
//           ) : (
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {cats.map((c) => (
//                 <div key={c._id} className="border rounded-2xl p-4 hover:bg-gray-50 transition">
//                   <p className="font-bold text-gray-900">{c.name || c.title}</p>
//                   <p className="text-sm text-gray-600 mt-1">{c.description || "—"}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
