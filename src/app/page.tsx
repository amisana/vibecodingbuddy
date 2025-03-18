import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full flex flex-col gap-8 items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">CopyCode</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">A modern file management and copying tool</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/copier"
            className="p-6 border rounded-xl hover:shadow-md transition-all hover:border-blue-500/50 flex flex-col items-center text-center gap-4 h-full"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <Image 
                src="/upload.svg" 
                alt="Upload" 
                width={32} 
                height={32}
                className="text-blue-500"
              />
            </div>
            <h2 className="text-xl font-semibold">File Copier</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Drag and drop files or folders to organize and copy them
            </p>
          </Link>

          <div className="p-6 border rounded-xl flex flex-col items-center text-center gap-4 h-full border-dashed opacity-70">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
              <Image 
                src="/file.svg" 
                alt="File" 
                width={32} 
                height={32}
              />
            </div>
            <h2 className="text-xl font-semibold">More Features Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Stay tuned for additional file management capabilities
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 border rounded-xl w-full">
          <h2 className="text-xl font-semibold mb-4">About CopyCode</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            CopyCode is a modern, web-based tool designed to help you manage and organize your files efficiently.
            With features like drag-and-drop file handling and folder organization, CopyCode makes file management simple and intuitive.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Built with Next.js and modern web technologies.
          </p>
        </div>
      </div>
    </div>
  );
}
