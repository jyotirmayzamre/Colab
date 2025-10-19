import FormInput from './FormInput';
import { useEffect, type JSX } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/useAuth';


type FormFields = {
    username: string,
    password: string
}

function LoginForm(): JSX.Element {
    const { register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting }
    } = useForm<FormFields>();

    const navigate = useNavigate();

    const { login, user } = useAuth(); 

    useEffect(() => {
        if(user){
            navigate(`/home/${user?.user_id}`)
        }
    }, [user, navigate])

    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        try{
            await login(data.username, data.password);
            navigate(`/home/${user?.user_id}`);
        } catch(error){
            if(error instanceof Error){
                setError('root', {
                    message: error.message
                })
            }
        }
        
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}
            className='bg-white text-gray-900 w-full'>
            <div className="mb-8">
                <h2 className="text-3xl font-semibold mb-2">Welcome back to Colab</h2>
                <p className="text-gray-500">Please enter your details</p>
            </div>
            {errors.root && (
                <div className="text-red-500 text-xs m-0 p-0">{errors.root.message}</div>
            )}
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
                        {isSubmitting ? 'Loading...' : 'Login'}
                    </button>
                    <p>Don't have an account? <Link className='text-blue-500 hover:underline' to={'/auth/signup'}>Register</Link></p>
                </div>
        </form>
    )
}

export default LoginForm;