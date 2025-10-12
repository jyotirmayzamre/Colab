import FormInput from './FormInput';
import { type JSX } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { Link } from 'react-router-dom';


type FormFields = {
    username: string,
    password: string
}

function LoginForm(): JSX.Element {
    const { register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<FormFields>();

    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/accounts/login/',
                data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Response: ', response.data)
        } catch(error: unknown){
            if(error instanceof Error){
                console.error(error.message)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}
            className='bg-white text-black p-10'>
            <div className="m-4">
                <h2 className="text-3xl m-1">Login To Your Account</h2>
                <p className="text-gray-600">Join Colab</p>
            </div>
            <FormInput 
                label='Username'
                id='username'
                register={register('username', {
                    required: 'Username is required'
                })}
                error={errors.username}
            />
            <FormInput 
                label='Password'
                id='password'
                type='password'
                register={register('password', {
                    required: 'Password is required'
                })}
                error={errors.password}
            />
            <div className="mt-4 mb-4">
                    <button 
                        className="text-white bg-green-800 p-3 w-full rounded-lg mb-3 hover:cursor-pointer
                            transition active:scale-95
                        "
                        disabled={isSubmitting} type='submit'>
                        {isSubmitting ? 'Loading' : 'Login'}
                    </button>
                    <p>Don't have an account? <Link to={'/auth/signup'}>Register</Link></p>
                </div>
        </form>
    )
}

export default LoginForm;