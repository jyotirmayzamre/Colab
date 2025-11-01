import { type JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import { Link } from "react-router-dom";
import { FileText, User, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger,DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem  } from "@/Components/dropdown";
import { Button } from "@/Components/button";

function DashboardNavbar(): JSX.Element {
    const { logout, user } = useAuth();

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
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
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
      </nav>
    )
}

export default DashboardNavbar;