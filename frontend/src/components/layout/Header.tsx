import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b w-full flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 lg:space-x-8 min-w-0">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-gray-900 flex-shrink-0"
            >
              Course Tracker
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                >
                  Dashboard
                </Link>
                {user?.role === "professor" && (
                  <>
                    <Link
                      to="/courses"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Courses
                    </Link>
                    <Link
                      to="/assignments"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      Assignments
                    </Link>
                    <Link
                      to="/grades"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Grades
                    </Link>
                  </>
                )}
                {user?.role === "student" && (
                  <>
                    <Link
                      to="/courses"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      My Courses
                    </Link>
                    <Link
                      to="/assignments"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      Assignments
                    </Link>
                    <Link
                      to="/grades"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Grades
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
