import { useEffect, useRef } from "react";

function useProfiler(name: string): void {
    const counter = useRef(0);

    counter.current += 1;

    useEffect(() => {
        console.log(`${name} render counter: ${counter.current}`)
    })
}

export default useProfiler;