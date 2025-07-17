// "use client";
import Layout from "../../layout/layout";

import CustomSidebar from "../../components/CustomSidebar";

export const Metadata = {
    title: "PrimeReact Sakai",
    description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components."
};

export default function AppLayout({ children }) {
    return (
        <Layout>
            <CustomSidebar />
            {children}
        </Layout>
    );
}
