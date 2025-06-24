"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import FormField from "@/components/FormField"
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/firebase/client"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { signIn, signUp } from "@/lib/actions/auth.action"
import { useState } from "react"
import { signOut } from "firebase/auth"

const authFormSchema = (type : FormType) => { 
  return z.object({
    name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  })
}

const AuthForm = ({type}:{type: FormType}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const getErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few minutes before trying again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign in is not enabled.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    try {
      if(type === 'sign-up'){
        const { name, email, password } = values;
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        const result  = await signUp({
          uid : userCredentials.user.uid,
          name : name!,
          email : email,
          password: password,
        })

        if(!result?.success){
          toast.error(result?.message);
          return;
        } 

        toast.success('Account created successfully! Please sign in.');
        router.push('/sign-in'); 
      } else {
        const {email, password} = values;

        const userCredentials = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await userCredentials.user.getIdToken();

        if(!idToken){
            toast.error('Failed to sign in. Please try again.');
            return;
        }

        await signIn({
            email, idToken
        }) 

        toast.success('Signed in successfully.');
        router.push('/');
      }
    } catch(error) {
      console.log(error);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38}/>
          <h2 className="text-primary-100">JustPrep</h2>
        </div>
        <h3>Practice Job Interview with AI</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">
          {!isSignIn && (
            <FormField 
              control={form.control} 
              name="name" 
              label="Name" 
              placeholder="Your Name"
            /> 
          )}
          <FormField 
            control={form.control} 
            name="email" 
            label="Email" 
            placeholder="Your email address"
            type="email"
          />
          <FormField 
            control={form.control} 
            name="password" 
            label="Password" 
            placeholder="Enter your Password"
            type="password"
          />
          <Button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (isSignIn ? 'Sign in' : 'Create an account')}
          </Button>
        </form>
        <p className="text-center">
          {isSignIn ? 'No account yet?' : 'Have an account already?'}
          <Link 
            href={!isSignIn ? '/sign-in' : '/sign-up'} 
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign in" : "Sign up"}      
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm