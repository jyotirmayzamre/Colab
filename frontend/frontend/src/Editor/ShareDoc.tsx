import { useEffect, useRef, useState, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import FormInput from "../AuthPage/FormInput";
import api from "../Auth/api";
import { useParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import Swal from "sweetalert2";

type FormFields = {
    username: string,
    access: string,
    user_id: string
}

type User = {
    username: string,
    id: string,
    first_name: string,
    last_name: string,
    site_id: number,
    email: string
}

function ShareDoc(): JSX.Element {
    const [query, setQuery] = useState<string>('');
    const [url, setUrl] = useState<string>('');
    const [results, setResults] = useState<User[]>([]);
    const params = useParams();

    const { register,
            handleSubmit,
            setValue,
            watch,
            formState: { errors, isSubmitting },
    } = useForm<FormFields>();


    //Submit handler for share document form
    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        const docId = params.docId;
        const userId = data.user_id;
        const access = data.access;
        const payload = { document: docId, user: userId, level: access}

        try{
            await api.post('/api/permissions/share/', payload)
            dialogRef.current?.close();
        } catch{
            Swal.fire({
                title: 'Error!',
                text: 'Could not share document :(',
                icon: 'error',
                showConfirmButton: false,
                toast: true,
                timer: 3000,
                position: 'top',
            })
        }
    }

    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const openModal = async (): Promise<void> => {
        dialogRef.current?.showModal();
    }

    const closeModal = (): void => {
        dialogRef.current?.close();
    }

    const access = watch('access', 'editor');

    useEffect(() => {
        const fetchShare = async () => {
            const data = { docId: params.docId, role: access }
            try {
                const response = await api.post('/api/permissions/createShareLink/', data);
                setUrl(response.data.link);
            } catch{
                Swal.fire({
                    title: 'Error!',
                    text: 'Could not create share link :(',
                    icon: 'error',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top',
                })
            }
        }
        fetchShare();
    }, [params.docId, access])

    

    //Used to display search results in share form
    useEffect(() => {
        const getData = async () => {
        try{
            const response = await api.get(`/api/accounts/searchUsers/?q=${query}`);
            const data = response.data;
            setResults(data.results);
        } catch{
            Swal.fire({
                title: 'Error!',
                text: 'Could not search for users :(',
                icon: 'error',
                showConfirmButton: false,
                toast: true,
                timer: 3000,
                position: 'top',
            })
}
       }

       if(!query){
        setResults([]);
       } else {
            getData();
       }
 
    }, [query]);


    const onChange = (q: string) => {
        setQuery(q);
    }

    return (
        <>
        <dialog ref={dialogRef} className="w-11/12 max-w-md p-6 rounded-lg shadow-lg relative m-auto">
            <form method="dialog" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex mb-4 justify-between items-center">
                    <h2 className="text-2xl font-semibold ml-4">Share Document</h2>
                    <p className="hover:cursor-pointer" onClick={closeModal}>&#10006;</p>
                </div>
                <div className="flex justify-center items-start gap-2">
                    <FormInput 
                        id="name"
                        register={register('username')}
                        error={errors.username}
                        placeholder="Search by name..."
                        onChange={onChange}
                    />
                    <input type='hidden' {...register('user_id')} />

                    <select className='rounded-sm border border-black p-2 bg-white' {...register('access', { required: true })}>
                        <option value="editor" defaultChecked>Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>

                </div>
                <div>
                    <ul className="bg-[rgb(233,238,246)] shadow-lg rounded-md">
                        {results && results.map((user) => {return (
                            <li key={user.id} className="flex flex-col justify-center items-start m-0 p-2 text-sm hover:cursor-pointer hover:bg-gray-300 rounded-md"
                                onClick={() => {
                                    setValue('username', user.username);
                                    setQuery('');
                                    setValue('user_id', user.id);
                                }}>
                                <span>{user.first_name} {user.last_name}</span>
                                <span className="text-gray-700">{user.username}</span>
                            </li>
                        )})}
                    </ul>
                </div>
                <div className="flex justify-center items-center m-2">
                    <button className='rounded-lg py-3 px-5 bg-blue-800 text-white w-21 hover:cursor-pointer hover:brightness-125' type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Loading...' : 'Share'}
                    </button>
                </div>
                <div className="m-2 justify-center items-center">
                    <p>or</p>
                </div>

                 <div className="flex justify-center items-center gap-2">
                    <p>Share Link: </p>
                    <button type='button' className="p-3 rounded-sm bg-gray-100 hover:cursor-pointer hover:bg-gray-200 overflow-hidden text-ellipsis whitespace-nowrap w-60"
                    onClick={() => {
                        navigator.clipboard.writeText(url)
                        alert('Link copied')
                    }}
                    >{url}</button>
                </div>
                
            </form>
        </dialog>
        <Share2 className="h-4 w-4  hover:cursor-pointer" onClick={openModal} />
        </>
    )
}

export default ShareDoc;