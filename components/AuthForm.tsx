"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { signIn, signUp } from "@/features/auth/actions";
import { PASSWORD_MIN, SignInFormSchema, SignUpFormSchema } from "@/features/auth/schema";

import { auth } from "@/firebase/client";

import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";

import { identifyUser } from "@/lib/observability/client";

// One form component serves both modes; the shared schemas live in features/auth/schema.ts.
const authFormSchema = (type: FormType) =>
  type === "sign-up" ? SignUpFormSchema : SignInFormSchema.extend({ name: z.string().optional() });

const AuthForm = ({ type }: { type: FormType }) => {
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
  });

  const getErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a few minutes before trying again.";
      case "auth/user-not-found":
        return "No account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/weak-password":
        return `Password should be at least ${PASSWORD_MIN} characters long.`;
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/operation-not-allowed":
        return "Email/password sign in is not enabled.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) return; // Prevent multiple submissions

    setIsLoading(true);
    try {
      if (type === "sign-up") {
        const { name, email, password } = values;
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        // The server derives uid/email from the verified ID token, never from the client.
        const result = await signUp({
          idToken: await userCredentials.user.getIdToken(),
          name: name ?? "",
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully! Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = values;

        const userCredentials = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await userCredentials.user.getIdToken();

        if (!idToken) {
          toast.error("Failed to sign in. Please try again.");
          return;
        }

        const result = await signIn({ idToken });
        if (!result.success) {
          toast.error(result.message);
          return;
        }

        identifyUser(userCredentials.user.uid);

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="card flex flex-col gap-6 px-10 py-14">
        <div className="flex flex-row justify-center gap-2">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">JustPrep</h2>
        </div>
        <h3>Practice Job Interview with AI</h3>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="form mt-4 w-full space-y-6"
        >
          {!isSignIn && (
            <FormField control={form.control} name="name" label="Name" placeholder="Your Name" />
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
            {isLoading ? "Please wait..." : isSignIn ? "Sign in" : "Create an account"}
          </Button>
        </form>
        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="text-user-primary ml-1 font-bold"
          >
            {!isSignIn ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
