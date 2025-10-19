import type { JSX } from "react";
import type { Document } from "../../Pages/HomePage";



function DocumentList({ documents }: { documents: Document[] | null }): JSX.Element {
    return (
        <>
            <div className="flex justify-start items-center ml-10">
                <p>Recent documents</p>
            </div>
            <div className="flex flex-col justify-center items-start gap-0.5 w-[90%] p-5">
                {documents && documents.map((item: Document) => (
                <div key={item.id} className="bg-white flex justify-between items-center rounded-md shadow-sm p-5 w-full hover:cursor-pointer hover:opacity-75">
                    <div className="flex justify-center items-center gap-10">
                        <img src="/images/docs.png" className="h-7 w-7" />
                        <p>{item.title}</p>
                    </div>
                    <div className="flex justify-center items-center gap-14">
                        <p>{item.access}</p>
                        <p>{item.updated_at}</p>
                        <img src="/images/more.png" className="h-8 w-8 hover:cursor-pointer rounded-full hover:border hover:border-gray-300 p-1.5"/>
                    </div>
                </div>
            ))}
            </div>


        </>
    )
}

export default DocumentList;