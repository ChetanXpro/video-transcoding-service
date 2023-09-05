import Upload from "@/components/Upload/Upload";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-6xl font-bold text-center">Upload Your videos</h1>
      <Upload />
    </main>
  );
}
