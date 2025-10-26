import { useEffect, useRef, useState, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import FormInput from "../AuthForms/FormInput";
import api from "../Auth/api";
import { useParams } from "react-router-dom";

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
    const [results, setResults] = useState<User[]>([]);
    const params = useParams();

    const { register,
            handleSubmit,
            setValue,
            formState: { errors, isSubmitting }
    } = useForm<FormFields>();

    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        const docId = params.docId;
        const userId = data.user_id;
        const access = data.access;
        const payload = { document: docId, user: userId, level: access}

        try{
            await api.post('/api/documentAccess/', payload)
            dialogRef.current?.close();
        } catch(error){
            console.error(error);
        }
    }

    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const openModal = (): void => {
        dialogRef.current?.showModal();
    }

    const closeModal = (): void => {
        dialogRef.current?.close();
    }

    


    useEffect(() => {
        const getData = async () => {
        try{
            const response = await api.get(`/api/accounts/searchUsers/?q=${query}`);
            const data = response.data;
            setResults(data.results);
        } catch(error){
            console.error(error);
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
                        register={register('username', {
                            required: 'Required'
                        })}
                        error={errors.username}
                        placeholder="Search by name..."
                        onChange={onChange}
                    />
                    <input type='hidden' {...register('user_id')} />

                    <select className='rounded-sm border border-black p-2' {...register('access', { required: true })}>
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
                <div className="flex justify-center items-center">
                    <button className='rounded-lg p-2 bg-blue-800 text-white w-21 hover:cursor-pointer hover:brightness-125' type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Loading...' : 'Done'}
                    </button>
                </div>
                
            </form>
        </dialog>
        <button onClick={openModal} className=" flex justify-center items-center gap-2 rounded-4xl text-black bg-[rgb(194,231,255)] w-26 p-3 hover:cursor-pointer hover:brightness-90 transition active:scale-95" type="button">
            <img src='/images/padlock.png' className="h-5 w-5"/>
            Share</button>
        </>
    )
}

export default ShareDoc;