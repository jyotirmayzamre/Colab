import { useInfiniteQuery } from "@tanstack/react-query"
import api from "@/Auth/api"
import { useMemo } from "react"
import type { InfiniteData, FetchNextPageOptions, InfiniteQueryObserverResult } from "@tanstack/react-query"

interface InfiniteApiProps {
    param: string
    initialPageParam: string
    queryKey: unknown[]

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
    results: T[]
}


//Custom hook for using react query's infinite query in my projects
export default function useInfiniteApi<T>({ param, initialPageParam, queryKey }: InfiniteApiProps)
: InfiniteApiReturnType<T>{
    const { data, 
        fetchNextPage, 
        hasNextPage} = useInfiniteQuery<InfinitePage<T>>({
            queryKey: queryKey,
            queryFn: async({ pageParam = param }) => {
                const res = await api.get(pageParam as string);
                return res.data;
            },
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        initialPageParam: initialPageParam
        })

    const results = useMemo(
        () => data?.pages.flatMap(p => p.results) ?? [],
        [data]
    );

    return { fetchNextPage, hasNextPage, results }
}