import type { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface InputProps {
    label: string;
    type?: string;
    register: UseFormRegisterReturn;
    error?: FieldError;
    id: string;
}


function FormInput(data: InputProps){
    return (
        <div className="flex flex-col justify-center items-start m-1">
            <label className='font-medium m-1' htmlFor={data.id}>{data.label}</label>
            <input 
                className="p-2 border border-black rounded-lg w-full"
                id={data.id} type={data.type ? data.type: 'text'}
                {...data.register}
                placeholder={data.label}
            />
            {data.error && <div className="text-red-500 text-xs m-0 p-0">{data.error.message}</div>}
        </div>
    )
}

export default FormInput