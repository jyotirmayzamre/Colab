import { type JSX } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import FormInput from "./FormInput";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";

type FormFields = {
    username: string;
    password: string;
    confirm_password: string;
    email: string;
    first_name: string;
    last_name: string;
}

function RegisterForm(): JSX.Element {
    const { register, 
            handleSubmit,
            setError, 
            formState: { errors, isSubmitting },
            getValues } = useForm<FormFields>();

    const navigate = useNavigate();

    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirm_password, ...payload } = data; 
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/accounts/signup/`, 
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            navigate('/auth/login')
            
        } catch(error: unknown){
            if(error instanceof Error){
                setError('root', {
                    message: error.message
                })
            }
        }
        
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}
            className="bg-white text-gray-900 w-full"
        >
            <div className="m-4">
                <h2 className="text-3xl font-semibold mb-2">Start your journey today</h2>
                <p className="text-gray-500">Create your account</p>
            </div>
            {errors.root && (
                <div className="text-red-500 text-xs m-0 p-0">{errors.root.message}</div>
            )}
            <div>
                <div className="flex">
                    <FormInput 
                    label='First name'
                    id='first_name'
                    register={register('first_name', {
                        required: 'First name is required',
                        pattern: {
                            value: /^[A-Za-z]+$/,
                            message: "First name should only contain letters"

                        }
                    })}
                    error={errors.first_name}
                />
                <FormInput 
                    label='Last name'
                    id='last_name'
                    register={register('last_name', {
                        required: 'Last name is required',
                        pattern: {
                            value: /^[A-Za-z]+$/,
                            message: "First name should only contain letters"
                        }
                    })}
                    error={errors.last_name}
                />
                </div>
                
                <FormInput 
                    label="Username"
                    id='username'
                    register={register('username', {
                        required: 'Username is required'
                    })}
                    error={errors.username}
                />
                <FormInput
                    label='Email'
                    id='email'
                    register={register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                            message: "Input should be a valid email"
                        }
                    })}
                    error={errors.email}
                />
                <FormInput
                    label="Password"
                    id='password'
                    type="password"
                    register={register('password', {
                        required: 'Password is required',
                        minLength: {
                            value: 8,
                            message: 'Password should be at least 8 characters'
                        }
                    })}
                    error={errors.password}
                />

                <FormInput
                    label='Confirm password'
                    id='confirm_password'
                    type="password"
                    register={register('confirm_password', {
                        required: "Please confirm your password",
                        validate: (val) => {
                            if(val !== getValues('password')){
                                return 'Passwords must match'
                            }
                            return true;
                        }
                    })}
                    error={errors.confirm_password}
                />
                <div className="mt-4 mb-4">
                    <button 
                        className="text-white bg-green-800 p-3 w-full rounded-lg mb-3 hover:cursor-pointer
                            transition active:scale-95
                        "
                        disabled={isSubmitting} type='submit'>
                        {isSubmitting ? 'Loading...' : 'Create Account'}
                    </button>
                    <p>Already have an account? <Link className='text-blue-500 hover:underline' to={'/auth/login'}>Login</Link></p>
                </div>
            </div>
        </form>
    )
}

export default RegisterForm;