import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/Auth/api"
import { useMemo } from "react"
import type { InfiniteData, FetchNextPageOptions, InfiniteQueryObserverResult } from "@tanstack/react-query"

interface InfiniteApiProps {
    param: string
    initialPageParam: string
    queryKey: readonly unknown[]

}

interface InfinitePage<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[]
}

interface InfiniteApiReturnType<T> {
    fetchNextPage: (options?: FetchNextPageOptions) 
        => Promise<InfiniteQueryObserverResult<InfiniteData<InfinitePage<T>, unknown>, Error>>
    hasNextPage: boolean
    results: T[],
    invalidateCache(queryKey: readonly unknown[]): void
}


//Custom hook for using react query's infinite query in my projects
export default function useInfiniteApi<T>({ param, initialPageParam, queryKey }: InfiniteApiProps)
: InfiniteApiReturnType<T>{
    const queryClient = useQueryClient();
    const { data, 
        fetchNextPage, 
        hasNextPage} = useInfiniteQuery<InfinitePage<T>>({
            queryKey: queryKey,
            queryFn: async({ pageParam = param }) => {
                const res = await api.get(pageParam as string);
                return res.data;
            },
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        initialPageParam: initialPageParam,
        staleTime: 5 * 60 * 1000,          
        refetchOnWindowFocus: false,
        refetchOnMount: false
        })

    const results = useMemo(
        () => data?.pages.flatMap(p => p.results) ?? [],
        [data]
    );

    function invalidateCache(queryKey: readonly unknown[]){
        queryClient.invalidateQueries({ queryKey: queryKey});
    }

   
    return { fetchNextPage, hasNextPage, results, invalidateCache }
}