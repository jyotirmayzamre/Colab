import { type JSX, useCallback, useState } from "react";
import { useAuth } from "../../Auth/useAuth";
import { Link } from "react-router-dom";
import { FileText, User, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger,DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem  } from "@/ui/dropdown";
import { Button } from "@/ui/button";
import UserProfile from "./UserProfile";
import { Settings } from "lucide-react";


function DashboardNavbar(): JSX.Element {
    const { logout, user } = useAuth();
    const [showProfile, setShowProfile] = useState<boolean>(false);

    const handleCloseProfile = useCallback(() => {
      setShowProfile(false);
    }, []);

    return (
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/home/${user.user_id}`} className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Colab</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setShowProfile(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <UserProfile 
          open={showProfile}
          onClose={handleCloseProfile}
        />
      </nav>
    )
}

export default DashboardNavbar;
