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
        <div className="flex flex-col justify-center items-start ml-1 mr-1">
            <label className='font-light m-1' htmlFor={data.id}>{data.label}</label>
            <input 
                className="p-1.5 border border-black rounded-lg w-full"
                id={data.id} type={data.type ? data.type: 'text'}
                {...data.register}
            />
            <div className="text-red-500 text-xs m-0 p-0">{data.error ? data.error.message : '\u00A0'}</div>
        </div>
    )
}

export default FormInput