import { getProviders, signIn } from "next-auth/react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";

export default function SignIn({ providers }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 relative">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[-1]"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -1,
        }}
      >
        <source src="/sign_in_vid1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="w-full max-w-md p-8 rounded shadow bg-white bg-opacity-90 flex flex-col gap-4 items-center z-10 relative">
        <Image src="/nao_logo_mintpage.png" alt="NAO Logo" width={100} height={100} />
        <h1 className="text-2xl font-bold mb-6">Sign in</h1>
        {providers &&
          Object.values(providers).map((provider: any) => (
            <div key={provider.name} className="w-full flex justify-center">
              <button
                className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              >
                Sign in with {provider.name}
              </button>
            </div>
          ))}
        <div className="mt-6 text-gray-600 text-sm">
          New to NAO?{" "}
          <Link href="/signup" className="text-blue-700 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders();
  return {
    props: { providers },
  };
};