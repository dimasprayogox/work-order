// "use client"; // Biarkan ini dikomentari, karena ini adalah file layout
import { Suspense } from 'react'; // 1. Import Suspense
import Layout from "../../layout/layout";
import CustomSidebar from "../../components/CustomSidebar";

// 2. Ubah nama variabel menjadi huruf kecil
export const metadata = {
    title: "PrimeReact Sakai",
    description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components."
};

export default function AppLayout({ children }) {
    return (
        // 3. Bungkus komponen <Layout> dengan <Suspense>
        <Suspense fallback={<div>Loading...</div>}>
            <Layout>
                {/* CustomSidebar bisa tetap di sini atau dipindahkan ke dalam Layout jika lebih sesuai */}
                <CustomSidebar />
                {children}
            </Layout>
        </Suspense>
    );
}
