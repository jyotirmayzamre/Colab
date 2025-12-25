import { Search } from "lucide-react";
import { Input } from "@/Components/input";


interface Props {
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
}



function SearchDocument({ query, setQuery }: Props){

    return (
        <div className="mb-6 flex flex-col justify-center items-center">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search documents..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                    }}
                    className="pl-10 h-12 w-full"
                />
            </div>  
        </div>
    )
}

export default SearchDocument;