import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, BookOpen, LayoutGrid, LogOut, ChevronRight, ChevronLeft } from "lucide-react";

const navigation = [
  { name: "Profile Summary", href: "#summary", icon: Search },
  { name: "AI Insights", href: "#ai-insights", icon: BookOpen },
  { name: "Repository Archive", href: "#archive", icon: LayoutGrid },
];

// interface SidebarProps {
//   user: {
//     name?: string | null;
//     email?: string | null;
//     image?: string | null;
//   };
// }

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isActive = (href: string) => pathname?.includes(href.replace("#", ""));

  return (
    <div 
      className={`group flex flex-col h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Logo with Toggle Button */}
      <div className="relative flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 ml-1">
          <Image 
            src="/gitprooflogo.png" 
            height={25} 
            width={25} 
            alt="logo" 
            className="shrink-0"
          />
          {!isCollapsed && <span className="text-xl font-semibold font-reckless">GitProof</span>}
        </div>
        
        {/* Toggle Button - Visible when expanded or on hover when collapsed */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className={`
            flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-md 
            hover:bg-gray-100 transition-colors duration-200
            ${isCollapsed 
              ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100' 
              : 'w-6 h-6'}
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {/* <div className="px-4 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "Profile"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">{user?.name?.[0] || "U"}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navigation.map(({ name, href, icon: Icon }) => (
            <a
              key={name}
              href={href}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                isActive(href)
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={isCollapsed ? name : ''}
            >
              <div className={`flex items-center justify-center ${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-6 h-6 mr-3'}`}>
                <Icon className="w-5 h-5" />
              </div>
              {!isCollapsed && <span className="truncate">{name}</span>}
            </a>
          ))}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          title={isCollapsed ? 'Logout' : ''}
        >
          <div className={`flex items-center justify-center ${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-6 h-6 mr-3'}`}>
            <LogOut className="w-5 h-5" />
          </div>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
