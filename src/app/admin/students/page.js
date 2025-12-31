"use client";
import { useState, useEffect } from "react";
import { Search, BookOpen, Mail, Calendar, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link"; // Make sure Link is imported

export default function AdminStudents() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Force refresh data
      const res = await fetch(`/api/admin/users?refresh=${Date.now()}`, { 
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      });
      
      const data = await res.json();
      console.log("Users List Data:", data); // Debugging: Check console to see if _id exists

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (user.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-3 pb-24 md:p-8 relative overflow-y-auto selection:bg-yellow-500/30">
       
       {/* Background Blobs */}
       <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-yellow-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-6 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2 md:mb-3">
              <Sparkles size={12} /> Student Database
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Management</span>
            </h1>
            
            <p className="text-gray-400 mt-2 font-medium text-xs md:text-base">
              Status: <span className="text-green-400">Online</span> 
              {" | "} Learners: <span className="text-white font-bold">{users.length}</span>
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-96">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-purple-500/30 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl flex items-center p-1 focus-within:border-yellow-400/50 transition-colors">
                  <div className="pl-3 md:pl-4 pr-2 md:pr-3 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                    <Search size={18} className="md:w-5 md:h-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-500 py-2 md:py-3 text-sm md:text-base outline-none border-none font-medium"
                  />
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredUsers.map((user, index) => (
              <Link
                href={`/admin/students/${user._id}`} // Checking ID here
                key={user._id || index}
                className="group relative bg-white/[0.03] backdrop-blur-lg border border-white/10 hover:border-yellow-500/30 rounded-2xl md:rounded-3xl p-0 md:p-6 overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1 block"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-yellow-400/0 to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                 {/* MOBILE VIEW */}
                 <div className="flex md:hidden flex-col gap-3 p-4">
                     <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner ${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20' 
                              : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-yellow-500/20'
                          }`}>
                              {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className="font-bold text-sm text-white truncate pr-2">{user.name || "Unknown"}</h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                    user.role === 'admin' 
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                                    : 'bg-green-500/10 text-green-300 border-green-500/20'
                                }`}>
                                    {user.role || "Student"}
                                </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 truncate">
                               <Mail size={10} className="mr-1" /> {user.email || "No Email"}
                            </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 border-t border-white/5 pt-2 relative z-10">
                         <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <BookOpen size={12} className="text-blue-400"/>
                            <span>{user.courses?.length || 0} Courses</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Calendar size={12} className="text-pink-400"/>
                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                         </div>
                     </div>
                 </div>

                 {/* DESKTOP VIEW */}
                 <div className="hidden md:block">
                     <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${
                          user.role === 'admin' 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20' 
                            : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-yellow-500/20'
                        }`}>
                            {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                            user.role === 'admin' 
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                            : 'bg-green-500/10 text-green-300 border-green-500/20'
                        }`}>
                            {user.role || "Student"}
                        </span>
                     </div>

                     <div className="relative z-10 mb-6">
                        <h3 className="text-xl font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                          {user.name || "Unknown User"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 truncate">
                           <Mail size={14} className="text-gray-600" /> {user.email || "No Email"}
                        </div>
                     </div>

                     <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

                     <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-black/40 rounded-2xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 mb-1">
                              <BookOpen size={10} className="text-blue-400"/> Courses
                            </span>
                            <span className="text-white font-black text-lg">{user.courses?.length || 0}</span>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 mb-1">
                              <Calendar size={10} className="text-pink-400"/> Joined
                            </span>
                            <span className="text-white font-bold text-[10px]">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                        </div>
                     </div>
                 </div>
              </Link>
            ))}
        </div>

        {/* Loading State */}
        {isLoading && (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
        )}

        {/* No Results State */}
        {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 mt-10 backdrop-blur-sm">
                <div className="inline-flex p-4 rounded-full bg-white/5 mb-4 text-gray-400">
                   <GraduationCap size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">No students found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
                <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400">
                  Force Refresh
                </button>
            </div>
        )}
      </div>
    </div>
  );
}