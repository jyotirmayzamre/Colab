import { Search } from "lucide-react";
import { Input } from "@/Components/input";

type props = {
    searchQuery: string,
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>,
}

function SearchDocument({ searchQuery: searchQuery, setSearchQuery: setSearchQuery}: props){
    return (
        <div className="mb-6">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                />
            </div>
        </div>
    )
}

export default SearchDocument;