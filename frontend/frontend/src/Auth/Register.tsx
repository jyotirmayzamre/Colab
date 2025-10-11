import { type JSX } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import FormInput from "./FormInput";

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
            formState: { errors, isSubmitting },
            getValues } = useForm<FormFields>();

    const onSubmit: SubmitHandler<FormFields> = (data) => {
        console.log(data)
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}
            className="bg-white text-black p-10"
        >
            <div className="m-4">
                <h2 className="text-3xl m-1">Create Your Account</h2>
                <p className="text-gray-600">Join Colab</p>
            </div>
            <div>
                <div className="flex">
                    <FormInput 
                    label='First Name'
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
                    label='Last Name'
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
                    label='Confirm Password'
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
                        {isSubmitting ? 'Loading' : 'Create Account'}
                    </button>
                    <p>Already have an account?</p>
                </div>
            </div>
        </form>
    )
}

export default RegisterForm;