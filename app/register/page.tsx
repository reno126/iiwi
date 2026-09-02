"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useState } from "react";
import { RegisterSchema } from "@/schemas/schema";
import { zodResolver } from "@hookform/resolvers/zod";

interface FormTypes {
  name: string;
  email: string;
  password: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [isRegistered, setRegistered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormTypes>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: FormTypes) => {
    const response = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setRegistered(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  if (isRegistered) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Rejestracja zakończona sukcesem</h1>
        <p className="mb-4"> Twoje konto zostało pomyślnie utworzone.</p>
        <p className="mb-4"> Możesz się teraz zalogować za pomocą swoich danych.</p>

        <p className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Trwa przekierowywanie do strony logowania...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Utwórz konto</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">
            Imię i nazwisko
          </label>
          <input
            {...register("name")}
            type="text"
            id="name"
            className="w-full p-2 border rounded"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block mb-1 font-medium">
            Adres e-mail
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            className="w-full p-2 border rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 font-medium">
            Hasło
          </label>
          <input
            {...register("password")}
            type="password"
            id="password"
            className="w-full p-2 border rounded"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded text-white ${
            isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Masz już konto?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Zaloguj się
          </a>
        </p>
      </div>
    </div>
  );
}
