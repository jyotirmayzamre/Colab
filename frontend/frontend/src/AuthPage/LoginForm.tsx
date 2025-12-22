import FormInput from './FormInput';
import { type JSX } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/useAuth';
import { FileText,  } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent,  } from '@/Components/card';
import { Button } from '@/Components/button';


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

    const { login } = useAuth(); 

    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        try{
            await login(data.username, data.password);
        } catch {
          setError('root', {
            message: 'Incorrect credentials'
          })
        }
        
    }

    return (
        <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Colab</span>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-left">Sign in</CardTitle>
              <CardDescription className="text-base text-left">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <p className='text-red-600 text-sm'>{errors.root ? errors.root.message : ''}</p>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                 <FormInput 
                    label='Username'
                    id='username'
                    register={register('username', {
                        required: 'Username is required'
                    })}
                    error={errors.username}
                />
                </div>
                <div className="space-y-2">
                  <FormInput 
                    label='Password'
                    id='password'
                    type='password'
                    register={register('password', {
                        required: 'Password is required'
                    })}
                    error={errors.password}
                    />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/auth/register" className="text-primary font-semibold hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    )
}

export default LoginForm;