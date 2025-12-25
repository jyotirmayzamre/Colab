import { type JSX } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import FormInput from "./FormInput";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/Components/button";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/Components/card";

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
        const apiUrl = import.meta.env.VITE_BACKEND_URL
        try {
            await axios.post(`${apiUrl}/api/accounts/signup/`, 
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            navigate('/auth/login')
            
        } catch(error){
            const keys = Object.keys(error.response.data)
            setError('root', {
                message: error.response.data[keys[0]][0]
            })
            
        }
        
    };

    return (

        <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">CollabEdit</span>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold">Create account</CardTitle>
              <CardDescription className="text-base">
                Get started with your free account
              </CardDescription>
            </CardHeader>
            <p className="text-red-600 text-sm p-2 mb-3">{errors.root ? errors.root.message : ''}</p>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-0.5 flex justify-center items-center gap-2">
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
                <div className="space-y-0.5">
                    <FormInput 
                        label="Username"
                        id='username'
                        register={register('username', {
                            required: 'Username is required'
                        })}
                        error={errors.username}
                    />
                </div>
                <div className="space-y-0.5">
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
                </div>
                <div className="space-y-0.5">
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
                </div>
                <div className="space-y-0.5">
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
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-secondary hover:bg-secondary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/auth/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{" "}
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

export default RegisterForm;