import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';
import ForgotPasswordPage from '../_components/forgot-password';

export const metadata: Metadata = {
    title: "Forgot Password",
};

const Page = () => {
    return (
        <>
            <Header />
            <ForgotPasswordPage />
            <Footer />
        </>
    )
}

export default Page
