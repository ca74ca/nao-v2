import { getProviders } from "next-auth/react";
import { GetServerSideProps } from "next";

export default function SignUp() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
        style={{
          minWidth: "100vw",
          minHeight: "100vh",
          objectFit: "cover",
        }}
      >
        <source src="/sign_up_vid.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Optional: semi-transparent overlay for readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-0"></div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders();
  return {
    props: { providers },
  };
};